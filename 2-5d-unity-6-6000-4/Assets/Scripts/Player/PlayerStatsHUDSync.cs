// Namespace: StarfallContinent.Player
// Bridges player stat events to the UI manager.
using UnityEngine;
using StarfallContinent.UI;

namespace StarfallContinent.Player
{
    [RequireComponent(typeof(PlayerStats))]
    public sealed class PlayerStatsHUDSync : MonoBehaviour
    {
        public UIManager uiManager;

        private PlayerStats stats;

        private void Awake()
        {
            stats = GetComponent<PlayerStats>();
            if (uiManager == null)
                uiManager = FindFirstObjectByType<UIManager>();
        }

        private void OnEnable()
        {
            stats.HealthChanged += HandleHealthChanged;
            stats.StatsChanged += HandleStatsChanged;
        }

        private void Start()
        {
            HandleHealthChanged(stats.currentHealth, stats.maxHealth);
            HandleStatsChanged(stats);
        }

        private void OnDisable()
        {
            stats.HealthChanged -= HandleHealthChanged;
            stats.StatsChanged -= HandleStatsChanged;
        }

        private void HandleHealthChanged(float current, float max)
        {
            uiManager?.SetHealth(current, max);
        }

        private void HandleStatsChanged(PlayerStats playerStats)
        {
            uiManager?.SetPlayerStats(playerStats);
        }
    }
}
