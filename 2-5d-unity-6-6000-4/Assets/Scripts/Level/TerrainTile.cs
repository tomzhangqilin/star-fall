// Namespace: StarfallContinent.Level
// Fixed terrain tile that applies a movement multiplier while the player is inside it.
using UnityEngine;
using StarfallContinent.Data;
using StarfallContinent.Player;

namespace StarfallContinent.Level
{
    [RequireComponent(typeof(Collider))]
    public sealed class TerrainTile : MonoBehaviour
    {
        public TerrainType terrainType = TerrainType.Normal;
        public Renderer tileRenderer;
        public Color normalColor = new(0.35f, 0.55f, 0.35f);
        public Color fastColor = new(0.25f, 0.65f, 0.8f);
        public Color slowColor = new(0.55f, 0.45f, 0.25f);
        public Color verySlowColor = new(0.35f, 0.25f, 0.5f);

        private LevelManager levelManager;

        private void Awake()
        {
            Collider tileCollider = GetComponent<Collider>();
            tileCollider.isTrigger = true;

            if (tileRenderer == null)
                tileRenderer = GetComponentInChildren<Renderer>();
        }

        public void Configure(TerrainType type, LevelManager owner, float tileSize, Material themeMaterial)
        {
            terrainType = type;
            levelManager = owner;
            transform.localScale = new Vector3(tileSize, transform.localScale.y, tileSize);

            if (tileRenderer != null)
            {
                if (themeMaterial != null)
                    tileRenderer.sharedMaterial = themeMaterial;

                tileRenderer.material.color = GetTerrainColor(type);
            }
        }

        private void OnTriggerEnter(Collider other)
        {
            ApplyToPlayer(other);
        }

        private void OnTriggerStay(Collider other)
        {
            ApplyToPlayer(other);
        }

        private void OnTriggerExit(Collider other)
        {
            if (other.TryGetComponent(out PlayerStats playerStats))
                playerStats.SetTerrainSpeedMultiplier(1f);
        }

        private void ApplyToPlayer(Collider other)
        {
            if (!other.TryGetComponent(out PlayerStats playerStats))
                return;

            float multiplier = levelManager != null ? levelManager.GetSpeedMultiplier(terrainType) : 1f;
            playerStats.SetTerrainSpeedMultiplier(multiplier);
        }

        private Color GetTerrainColor(TerrainType type)
        {
            return type switch
            {
                TerrainType.Fast => fastColor,
                TerrainType.Slow => slowColor,
                TerrainType.VerySlow => verySlowColor,
                _ => normalColor
            };
        }
    }
}
