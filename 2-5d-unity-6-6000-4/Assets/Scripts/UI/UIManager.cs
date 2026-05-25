// Namespace: StarfallContinent.UI
// Lightweight Unity UI coordinator for gameplay HUD, shop, victory, and game-over screens.
using UnityEngine;
using UnityEngine.UI;
using StarfallContinent.Core;
using StarfallContinent.Data;
using StarfallContinent.Player;

namespace StarfallContinent.UI
{
    public sealed class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [Header("Panels")]
        public GameObject gameplayPanel;
        public GameObject shopPanel;
        public GameObject gameOverPanel;
        public GameObject victoryPanel;

        [Header("Gameplay HUD")]
        public Slider healthSlider;
        public Text healthText;
        public Text chapterText;
        public Text statsText;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
        }

        private void OnEnable()
        {
            GameManager.OnGameStateChanged += HandleGameStateChanged;
        }

        private void OnDisable()
        {
            GameManager.OnGameStateChanged -= HandleGameStateChanged;
        }

        public void ShowGameplay(ChapterData chapterData, int subLevelIndex)
        {
            SetPanel(gameplayPanel, true);
            SetPanel(shopPanel, false);
            SetPanel(gameOverPanel, false);
            SetPanel(victoryPanel, false);

            if (chapterText != null && chapterData != null)
                chapterText.text = $"Chapter {chapterData.chapterIndex}-{subLevelIndex}  {chapterData.displayName}";
        }

        public void ShowShop()
        {
            SetPanel(gameplayPanel, false);
            SetPanel(shopPanel, true);
            SetPanel(gameOverPanel, false);
            SetPanel(victoryPanel, false);
        }

        public void ShowGameOver()
        {
            SetPanel(gameplayPanel, false);
            SetPanel(shopPanel, false);
            SetPanel(gameOverPanel, true);
            SetPanel(victoryPanel, false);
        }

        public void ShowVictory()
        {
            SetPanel(gameplayPanel, false);
            SetPanel(shopPanel, false);
            SetPanel(gameOverPanel, false);
            SetPanel(victoryPanel, true);
        }

        public void SetHealth(float current, float max)
        {
            if (healthSlider != null)
            {
                healthSlider.maxValue = Mathf.Max(1f, max);
                healthSlider.value = Mathf.Clamp(current, 0f, healthSlider.maxValue);
            }

            if (healthText != null)
                healthText.text = $"{Mathf.CeilToInt(current)} / {Mathf.CeilToInt(max)}";
        }

        public void SetPlayerStats(PlayerStats stats)
        {
            if (statsText == null || stats == null)
                return;

            statsText.text =
                $"DMG {stats.damage:0.#}  SPD {stats.EffectiveMoveSpeed:0.#}\n" +
                $"FIRE {stats.fireRate:0.#}/s  CRIT {stats.critChance:P0}";
        }

        private void SetPanel(GameObject panel, bool active)
        {
            if (panel != null)
                panel.SetActive(active);
        }

        private void HandleGameStateChanged(GameState state)
        {
            GameManager manager = GameManager.Instance;
            switch (state)
            {
                case GameState.Playing:
                case GameState.BossRoom:
                    ShowGameplay(manager != null ? manager.ActiveChapter : null, manager != null ? manager.CurrentLevel + 1 : 1);
                    break;
                case GameState.Shop:
                    ShowShop();
                    break;
                case GameState.GameOver:
                    ShowGameOver();
                    break;
                case GameState.Victory:
                    ShowVictory();
                    break;
            }
        }
    }
}
