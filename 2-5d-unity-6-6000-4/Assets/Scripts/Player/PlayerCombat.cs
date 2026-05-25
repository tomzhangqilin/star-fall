// Namespace: StarfallContinent.Player
// Auto-targets the nearest enemy and fires at a fixed rate.
using UnityEngine;
using StarfallContinent.Core;
using StarfallContinent.Enemy;

namespace StarfallContinent.Player
{
    [RequireComponent(typeof(PlayerStats))]
    public sealed class PlayerCombat : MonoBehaviour
    {
        [Header("Targeting")]
        public float targetingRadius = 18f;
        public LayerMask enemyLayerMask = ~0;
        public Transform firePoint;

        [Header("Projectile")]
        public GameObject projectilePrefab;
        public float projectileSpeed = 22f;
        public float projectileLifetime = 3f;

        private readonly Collider[] targetBuffer = new Collider[64];
        private PlayerStats stats;
        private float nextShotTime;

        private void Awake()
        {
            stats = GetComponent<PlayerStats>();
            if (firePoint == null)
                firePoint = transform;
        }

        private void Update()
        {
            if (Time.time < nextShotTime)
                return;

            EnemyController target = FindNearestTarget();
            if (target == null)
                return;

            FireAt(target);
            nextShotTime = Time.time + stats.ShotInterval;
        }

        private EnemyController FindNearestTarget()
        {
            int hitCount = Physics.OverlapSphereNonAlloc(transform.position, targetingRadius, targetBuffer, enemyLayerMask, QueryTriggerInteraction.Ignore);
            EnemyController nearest = null;
            float bestDistanceSqr = float.MaxValue;

            for (int i = 0; i < hitCount; i++)
            {
                if (!targetBuffer[i].TryGetComponent(out EnemyController enemy) || enemy.IsDead)
                    continue;

                float distanceSqr = (enemy.transform.position - transform.position).sqrMagnitude;
                if (distanceSqr < bestDistanceSqr)
                {
                    bestDistanceSqr = distanceSqr;
                    nearest = enemy;
                }
            }

            return nearest;
        }

        private void FireAt(EnemyController target)
        {
            Vector3 aimDirection = (target.AimPoint - firePoint.position).normalized;
            float damage = stats.RollDamage();

            if (projectilePrefab == null)
            {
                target.TakeDamage(damage);
                FXManager.Instance?.PlayHit(target.AimPoint);
                return;
            }

            GameObject projectile = Instantiate(projectilePrefab, firePoint.position, Quaternion.LookRotation(aimDirection, Vector3.up));
            if (projectile.TryGetComponent(out Rigidbody projectileBody))
                projectileBody.linearVelocity = aimDirection * projectileSpeed;

            ProjectileDamage damageComponent = projectile.GetComponent<ProjectileDamage>();
            if (damageComponent == null)
                damageComponent = projectile.AddComponent<ProjectileDamage>();

            damageComponent.Initialize(damage, projectileLifetime);
        }
    }

    public sealed class ProjectileDamage : MonoBehaviour
    {
        private float damage;

        public void Initialize(float damageAmount, float lifetime)
        {
            damage = damageAmount;
            Destroy(gameObject, lifetime);
        }

        private void OnTriggerEnter(Collider other)
        {
            if (!other.TryGetComponent(out EnemyController enemy) || enemy.IsDead)
                return;

            enemy.TakeDamage(damage);
            FXManager.Instance?.PlayHit(enemy.AimPoint);
            Destroy(gameObject);
        }
    }
}
