// Namespace: StarfallContinent.UI
// Shop reward flow: choose one of three items or open a mystery blind box with pity.
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using StarfallContinent.Core;
using StarfallContinent.Data;
using StarfallContinent.Player;

namespace StarfallContinent.UI
{
    public sealed class ShopManager : MonoBehaviour
    {
        [Header("Inventory Pool")]
        public List<ItemData> itemPool = new();
        public int offeredItemCount = 3;

        [Header("Blind Box Pity")]
        public int legendaryPityThreshold = 5;
        public int blindBoxesSinceLegendary;

        [Header("UI")]
        public Button[] itemChoiceButtons;
        public Text[] itemChoiceTexts;
        public Button blindBoxButton;
        public Text blindBoxText;

        private readonly List<ItemData> currentOffers = new();
        private PlayerStats currentPlayer;

        private void Awake()
        {
            WireButtons();
        }

        private void OnEnable()
        {
            GameManager.OnGameStateChanged += HandleGameStateChanged;
        }

        private void OnDisable()
        {
            GameManager.OnGameStateChanged -= HandleGameStateChanged;
        }

        public void OpenShop(PlayerStats playerStats)
        {
            currentPlayer = playerStats;
            GenerateOffers();
            RefreshUI();
        }

        public void ChooseOffer(int index)
        {
            if (index < 0 || index >= currentOffers.Count)
                return;

            GrantItem(currentOffers[index]);
            GameManager.Instance?.ExitShop();
        }

        public void OpenBlindBox()
        {
            ItemData reward = RollBlindBoxReward();
            GrantItem(reward);
            GameManager.Instance?.ExitShop();
        }

        private void GenerateOffers()
        {
            currentOffers.Clear();
            List<ItemData> candidates = new(itemPool);
            int count = Mathf.Min(offeredItemCount, candidates.Count);

            for (int i = 0; i < count; i++)
            {
                int index = Random.Range(0, candidates.Count);
                currentOffers.Add(candidates[index]);
                candidates.RemoveAt(index);
            }
        }

        private ItemData RollBlindBoxReward()
        {
            if (itemPool.Count == 0)
                return null;

            bool pityTriggered = blindBoxesSinceLegendary + 1 >= legendaryPityThreshold;
            List<ItemData> candidates = pityTriggered
                ? itemPool.FindAll(item => item != null && item.rarity == ItemRarity.Legendary)
                : new List<ItemData>(itemPool);

            if (candidates.Count == 0)
                candidates = new List<ItemData>(itemPool);

            ItemData reward = candidates[Random.Range(0, candidates.Count)];
            if (reward != null && reward.rarity == ItemRarity.Legendary)
                blindBoxesSinceLegendary = 0;
            else
                blindBoxesSinceLegendary++;

            return reward;
        }

        private void GrantItem(ItemData item)
        {
            if (item == null || currentPlayer == null)
                return;

            item.ApplyTo(currentPlayer);
            FXManager.Instance?.PlayReward(currentPlayer.transform.position);
        }

        private void WireButtons()
        {
            if (itemChoiceButtons != null)
            {
                for (int i = 0; i < itemChoiceButtons.Length; i++)
                {
                    int index = i;
                    if (itemChoiceButtons[i] != null)
                        itemChoiceButtons[i].onClick.AddListener(() => ChooseOffer(index));
                }
            }

            if (blindBoxButton != null)
                blindBoxButton.onClick.AddListener(OpenBlindBox);
        }

        private void RefreshUI()
        {
            if (itemChoiceTexts != null)
            {
                for (int i = 0; i < itemChoiceTexts.Length; i++)
                {
                    bool hasOffer = i < currentOffers.Count && currentOffers[i] != null;
                    if (itemChoiceTexts[i] != null)
                        itemChoiceTexts[i].text = hasOffer ? FormatItem(currentOffers[i]) : "Empty";
                }
            }

            if (itemChoiceButtons != null)
            {
                for (int i = 0; i < itemChoiceButtons.Length; i++)
                {
                    if (itemChoiceButtons[i] != null)
                        itemChoiceButtons[i].interactable = i < currentOffers.Count;
                }
            }

            if (blindBoxText != null)
            {
                int remaining = Mathf.Max(1, legendaryPityThreshold - blindBoxesSinceLegendary);
                blindBoxText.text = $"Mystery Box\nLegendary pity in {remaining}";
            }
        }

        private string FormatItem(ItemData item)
        {
            string sign = item.flatBonus >= 0f ? "+" : string.Empty;
            string flat = Mathf.Abs(item.flatBonus) > 0.001f ? $" {sign}{item.flatBonus:0.##}" : string.Empty;
            string percent = Mathf.Abs(item.percentBonus) > 0.001f ? $" +{item.percentBonus:P0}" : string.Empty;
            return $"{item.displayName}\n{item.rarity}\n{item.statType}{flat}{percent}";
        }

        private void HandleGameStateChanged(GameState state)
        {
            if (state != GameState.Shop)
                return;

            PlayerStats playerStats = currentPlayer != null ? currentPlayer : FindFirstObjectByType<PlayerStats>();
            OpenShop(playerStats);
        }
    }
}
