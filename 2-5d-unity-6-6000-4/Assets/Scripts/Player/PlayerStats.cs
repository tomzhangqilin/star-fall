// Namespace: StarfallContinent.Player
// Runtime player attributes, damage handling, terrain modifiers, and item application.
using System;
using UnityEngine;
using StarfallContinent.Core;
using StarfallContinent.Data;

namespace StarfallContinent.Player
{
    public sealed class PlayerStats : MonoBehaviour
    {
        [Header("Base Stats")]
        public float maxHealth = 100f;
        public float moveSpeed = 7f;
        public float damage = 12f;
        public float fireRate = 2.5f;
        public float dodgeCooldown = 1.2f;
        [Range(0f, 1f)] public float critChance = 0.05f;

        [Header("Runtime")]
        public float currentHealth;
        public float terrainSpeedMultiplier = 1f;
        public bool IsInvincible { get; private set; }
        public float EffectiveMoveSpeed => moveSpeed * terrainSpeedMultiplier;
        public float ShotInterval => 1f / Mathf.Max(0.05f, fireRate);

        public event Action<PlayerStats> StatsChanged;
        public event Action<float, float> HealthChanged;
        public event Action Died;

        private float invincibleUntil;

        private void Awake()
        {
            currentHealth = Mathf.Clamp(currentHealth <= 0f ? maxHealth : currentHealth, 0f, maxHealth);
        }

        private void Update()
        {
            if (IsInvincible && Time.time >= invincibleUntil)
                IsInvincible = false;
        }

        public void TakeDamage(float amount)
        {
            if (IsInvincible || amount <= 0f)
                return;

            currentHealth = Mathf.Max(0f, currentHealth - amount);
            HealthChanged?.Invoke(currentHealth, maxHealth);
            StatsChanged?.Invoke(this);

            if (currentHealth <= 0f)
            {
                Died?.Invoke();
                GameManager.Instance?.TriggerGameOver();
            }
        }

        public void Heal(float amount)
        {
            if (amount <= 0f)
                return;

            currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
            HealthChanged?.Invoke(currentHealth, maxHealth);
            StatsChanged?.Invoke(this);
        }

        public void SetTerrainSpeedMultiplier(float multiplier)
        {
            terrainSpeedMultiplier = Mathf.Max(0.1f, multiplier);
            StatsChanged?.Invoke(this);
        }

        public void GrantInvincibility(float duration)
        {
            IsInvincible = true;
            invincibleUntil = Mathf.Max(invincibleUntil, Time.time + duration);
        }

        public float RollDamage()
        {
            bool crit = UnityEngine.Random.value < critChance;
            return crit ? damage * 2f : damage;
        }

        public void ApplyItem(ItemData item)
        {
            if (item == null)
                return;

            float multiplier = 1f + item.percentBonus;
            switch (item.statType)
            {
                case ItemStatType.MaxHealth:
                    maxHealth = Mathf.Max(1f, maxHealth * multiplier + item.flatBonus);
                    currentHealth = Mathf.Min(maxHealth, currentHealth + Mathf.Max(0f, item.flatBonus));
                    break;
                case ItemStatType.MoveSpeed:
                    moveSpeed = Mathf.Max(0.1f, moveSpeed * multiplier + item.flatBonus);
                    break;
                case ItemStatType.Damage:
                    damage = Mathf.Max(0f, damage * multiplier + item.flatBonus);
                    break;
                case ItemStatType.FireRate:
                    fireRate = Mathf.Max(0.05f, fireRate * multiplier + item.flatBonus);
                    break;
                case ItemStatType.DodgeCooldown:
                    dodgeCooldown = Mathf.Max(0.15f, dodgeCooldown * (1f - item.percentBonus) - item.flatBonus);
                    break;
                case ItemStatType.CritChance:
                    critChance = Mathf.Clamp01(critChance + item.flatBonus + item.percentBonus);
                    break;
            }

            HealthChanged?.Invoke(currentHealth, maxHealth);
            StatsChanged?.Invoke(this);
        }
    }
}
