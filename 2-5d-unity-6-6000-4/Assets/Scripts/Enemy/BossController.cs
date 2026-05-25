// Namespace: StarfallContinent.Enemy
// Multi-phase chapter boss behavior layered on top of EnemyController.
using System.Collections;
using UnityEngine;
using StarfallContinent.Core;

namespace StarfallContinent.Enemy
{
    public sealed class BossController : EnemyController
    {
        [Header("Boss Phases")]
        [Range(0.05f, 0.95f)] public float phaseTwoHealthPercent = 0.66f;
        [Range(0.05f, 0.95f)] public float phaseThreeHealthPercent = 0.33f;
        public float phaseCheckInterval = 0.2f;

        [Header("Attacks")]
        public GameObject areaAttackPrefab;
        public Transform attackOrigin;
        public float baseAttackInterval = 3f;
        public float phaseAttackIntervalStep = 0.65f;

        private int currentPhase = 1;
        private float healthMirror;

        protected override void Awake()
        {
            base.Awake();
            healthMirror = maxHealth;
        }

        private void OnEnable()
        {
            StartCoroutine(AttackRoutine());
        }

        public override void TakeDamage(float amount)
        {
            base.TakeDamage(amount);
            healthMirror = Mathf.Max(0f, healthMirror - Mathf.Max(0f, amount));
            UpdatePhase();
        }

        private void UpdatePhase()
        {
            float healthPercent = maxHealth <= 0f ? 0f : healthMirror / maxHealth;
            int nextPhase = healthPercent <= phaseThreeHealthPercent ? 3 : healthPercent <= phaseTwoHealthPercent ? 2 : 1;
            if (nextPhase <= currentPhase)
                return;

            currentPhase = nextPhase;
            FXManager.Instance?.ShakeCamera(0.35f, 0.35f);
        }

        private IEnumerator AttackRoutine()
        {
            while (!IsDead)
            {
                float interval = Mathf.Max(0.6f, baseAttackInterval - (currentPhase - 1) * phaseAttackIntervalStep);
                yield return new WaitForSeconds(interval);
                DoAreaAttack();
            }
        }

        private void DoAreaAttack()
        {
            if (areaAttackPrefab == null)
                return;

            Vector3 position = attackOrigin != null ? attackOrigin.position : transform.position;
            FXManager.Instance?.Spawn(areaAttackPrefab, position, Quaternion.identity);
        }
    }
}
