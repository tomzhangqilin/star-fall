// Namespace: StarfallContinent.Level
// Builds fixed terrain for each sub-level and applies chapter-specific terrain speed rules.
using System.Collections.Generic;
using UnityEngine;
using StarfallContinent.Core;
using StarfallContinent.Data;

namespace StarfallContinent.Level
{
    public sealed class LevelManager : MonoBehaviour
    {
        [Header("Terrain Grid")]
        public TerrainTile terrainTilePrefab;
        public Transform terrainRoot;
        public Vector2Int gridSize = new(12, 12);
        public float tileSize = 4f;
        [Range(0f, 1f)] public float fastChance = 0.12f;
        [Range(0f, 1f)] public float slowChance = 0.18f;
        [Range(0f, 1f)] public float verySlowChance = 0.08f;

        [Header("Theme Materials")]
        public Material terraMaterial;
        public Material ignisMaterial;
        public Material cryoMaterial;
        public Material voidMaterial;
        public Material starMaterial;

        private readonly List<TerrainTile> tiles = new();
        private ChapterData activeChapter;
        private int builtChapter = -1;
        private int builtLevel = -1;

        private void OnEnable()
        {
            GameManager.OnGameStateChanged += HandleGameStateChanged;
        }

        private void OnDisable()
        {
            GameManager.OnGameStateChanged -= HandleGameStateChanged;
        }

        public void BuildLevel(ChapterData chapterData, int subLevelIndex)
        {
            activeChapter = chapterData;
            ClearTiles();
            BuildFixedTerrain(subLevelIndex);
        }

        public float GetSpeedMultiplier(TerrainType terrainType)
        {
            return activeChapter != null ? activeChapter.GetSpeedMultiplier(terrainType) : 1f;
        }

        private void BuildFixedTerrain(int subLevelIndex)
        {
            if (terrainTilePrefab == null)
            {
                Debug.LogWarning("TerrainTile prefab is not assigned.");
                return;
            }

            if (terrainRoot == null)
                terrainRoot = transform;

            Random.State previousState = Random.state;
            int seed = activeChapter != null ? activeChapter.chapterIndex * 100 + subLevelIndex : subLevelIndex;
            Random.InitState(seed);

            Vector3 origin = new(
                -(gridSize.x - 1) * tileSize * 0.5f,
                0f,
                -(gridSize.y - 1) * tileSize * 0.5f
            );

            for (int x = 0; x < gridSize.x; x++)
            {
                for (int y = 0; y < gridSize.y; y++)
                {
                    Vector3 position = origin + new Vector3(x * tileSize, 0f, y * tileSize);
                    TerrainTile tile = Instantiate(terrainTilePrefab, position, Quaternion.identity, terrainRoot);
                    tile.name = $"Terrain_{x}_{y}";
                    tile.Configure(ChooseTerrainType(), this, tileSize, GetThemeMaterial());
                    tiles.Add(tile);
                }
            }

            Random.state = previousState;
        }

        private TerrainType ChooseTerrainType()
        {
            float roll = Random.value;
            if (roll < verySlowChance)
                return TerrainType.VerySlow;
            if (roll < verySlowChance + slowChance)
                return TerrainType.Slow;
            if (roll < verySlowChance + slowChance + fastChance)
                return TerrainType.Fast;
            return TerrainType.Normal;
        }

        private Material GetThemeMaterial()
        {
            if (activeChapter == null)
                return terraMaterial;

            return activeChapter.theme switch
            {
                ChapterTheme.Ignis => ignisMaterial,
                ChapterTheme.Cryo => cryoMaterial,
                ChapterTheme.Void => voidMaterial,
                ChapterTheme.Star => starMaterial,
                _ => terraMaterial
            };
        }

        private void ClearTiles()
        {
            for (int i = tiles.Count - 1; i >= 0; i--)
            {
                if (tiles[i] != null)
                    Destroy(tiles[i].gameObject);
            }

            tiles.Clear();
        }

        private void HandleGameStateChanged(GameState state)
        {
            if (state != GameState.Playing && state != GameState.BossRoom)
                return;

            GameManager manager = GameManager.Instance;
            if (manager == null)
                return;

            if (builtChapter == manager.CurrentChapter && builtLevel == manager.CurrentLevel)
                return;

            builtChapter = manager.CurrentChapter;
            builtLevel = manager.CurrentLevel;
            BuildLevel(manager.ActiveChapter, manager.CurrentLevel + 1);
        }
    }
}
