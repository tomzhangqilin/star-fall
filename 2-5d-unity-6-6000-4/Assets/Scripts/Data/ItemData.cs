// Namespace: StarfallContinent.Data
// ScriptableObject item definitions used by the shop and blind-box rewards.
using UnityEngine;
using StarfallContinent.Player;

namespace StarfallContinent.Data
{
    public enum ItemRarity
    {
        Common,
        Rare,
        Epic,
        Legendary
    }

    public enum ItemStatType
    {
        MaxHealth,
        MoveSpeed,
        Damage,
        FireRate,
        DodgeCooldown,
        CritChance
    }

    [CreateAssetMenu(menuName = "Starfall/Item Data", fileName = "ItemData")]
    public sealed class ItemData : ScriptableObject
    {
        [Header("Identity")]
        public string itemId = "item_id";
        public string displayName = "New Item";
        [TextArea] public string description;
        public Sprite icon;
        public ItemRarity rarity = ItemRarity.Common;

        [Header("Stat Modifier")]
        public ItemStatType statType = ItemStatType.Damage;
        public float flatBonus;
        public float percentBonus;

        public void ApplyTo(PlayerStats playerStats)
        {
            if (playerStats == null)
                return;

            playerStats.ApplyItem(this);
        }
    }
}
