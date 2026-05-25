// Namespace: StarfallContinent.Enemy
// Enemy health, contact damage, death events, and reward hooks.
using System;
using UnityEngine;
using StarfallContinent.Core;
using StarfallContinent.Player;

namespace StarfallContinent.Enemy
{
    public class EnemyController : MonoBehaviour
    {
        [Header("Stats")]
        public float maxHealth = 30f;
        public float contactDamage = 10f;
        public float contactDamageCooldown = 0.75f;

        [Header("Targeting")]
        public Transform aimPoint;

        public bool IsDead { get; private set; }
        public Vector3 AimPoint => aimPoint != null ? aimPoint.position : transform.position + Vector3.up;

        public event Action<EnemyController> Died;

        private float currentHealth;
        private float nextContactDamageTime;

        protected virtual void Awake()
        {
            currentHealth = maxHealth;
        }

        public virtual void TakeDamage(float amount)
        {
            if (IsDead || amount <= 0f)
                return;

            currentHealth = Mathf.Max(0f, currentHealth - amount);
            if (currentHealth <= 0f)
                Die();
        }

        protected virtual void Die()
        {
            if (IsDead)
                return;

            IsDead = true;
            Died?.Invoke(this);
            FXManager.Instance?.PlayDeath(transform.position);
            Destroy(gameObject);
        }

        private void OnCollisionStay(Collision collision)
        {
            TryDamagePlayer(collision.collider);
        }

        private void OnTriggerStay(Collider other)
        {
            TryDamagePlayer(other);
        }

        private void TryDamagePlayer(Collider other)
        {
            if (Time.time < nextContactDamageTime)
                return;

            if (!other.TryGetComponent(out PlayerStats playerStats))
                return;

            playerStats.TakeDamage(contactDamage);
            nextContactDamageTime = Time.time + contactDamageCooldown;
        }
    }
}
