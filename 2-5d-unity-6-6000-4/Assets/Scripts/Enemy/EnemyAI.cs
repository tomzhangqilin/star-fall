// Namespace: StarfallContinent.Enemy
// NavMeshAgent chase behavior for 2.5D top-down enemies.
using UnityEngine;
using UnityEngine.AI;
using StarfallContinent.Player;

namespace StarfallContinent.Enemy
{
    [RequireComponent(typeof(NavMeshAgent))]
    public sealed class EnemyAI : MonoBehaviour
    {
        public Transform target;
        public float repathInterval = 0.15f;
        public bool faceMovementDirection = true;

        private NavMeshAgent agent;
        private EnemyController enemy;
        private float nextRepathTime;

        private void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
            enemy = GetComponent<EnemyController>();
            agent.updateRotation = false;
            agent.updateUpAxis = true;
        }

        private void Start()
        {
            if (target == null)
            {
                PlayerStats player = FindFirstObjectByType<PlayerStats>();
                target = player != null ? player.transform : null;
            }
        }

        private void Update()
        {
            if (enemy != null && enemy.IsDead)
            {
                agent.isStopped = true;
                return;
            }

            if (target == null)
                return;

            if (Time.time >= nextRepathTime)
            {
                agent.SetDestination(target.position);
                nextRepathTime = Time.time + repathInterval;
            }

            if (faceMovementDirection && agent.velocity.sqrMagnitude > 0.01f)
                transform.rotation = Quaternion.LookRotation(agent.velocity.normalized, Vector3.up);
        }
    }
}
