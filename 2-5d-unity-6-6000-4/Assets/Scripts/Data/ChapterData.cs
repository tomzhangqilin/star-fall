// Namespace: StarfallContinent.Data
// ScriptableObject data for chapter themes, terrain rules, waves, and boss configuration.
using System;
using System.Collections.Generic;
using UnityEngine;

namespace StarfallContinent.Data
{
    public enum ChapterTheme
    {
        Terra,
        Ignis,
        Cryo,
        Void,
        Star
    }

    public enum TerrainType
    {
        Normal,
        Fast,
        Slow,
        VerySlow
    }

    [Serializable]
    public sealed class TerrainSpeedRule
    {
        public TerrainType terrainType = TerrainType.Normal;
        [Min(0.1f)] public float speedMultiplier = 1f;
    }

    [Serializable]
    public sealed class EnemySpawnEntry
    {
        public GameObject enemyPrefab;
        [Min(1)] public int count = 8;
        [Min(0f)] public float spawnInterval = 0.35f;
    }

    [Serializable]
    public sealed class WaveDefinition
    {
        [Min(0f)] public float delayBeforeWave = 1f;
        public List<EnemySpawnEntry> enemies = new();
    }

    [Serializable]
    public sealed class SubLevelDefinition
    {
        [Range(1, 5)] public int subLevelIndex = 1;
        public List<WaveDefinition> waves = new();
        public GameObject bossPrefab;
        public bool IsBossLevel => subLevelIndex == 5;
    }

    [CreateAssetMenu(menuName = "Starfall/Chapter Data", fileName = "ChapterData")]
    public sealed class ChapterData : ScriptableObject
    {
        [Header("Chapter")]
        [Range(1, 5)] public int chapterIndex = 1;
        public ChapterTheme theme = ChapterTheme.Terra;
        public string displayName = "Terra";

        [Header("Terrain Speed Multipliers")]
        public List<TerrainSpeedRule> terrainSpeedRules = new()
        {
            new TerrainSpeedRule { terrainType = TerrainType.Normal, speedMultiplier = 1f },
            new TerrainSpeedRule { terrainType = TerrainType.Fast, speedMultiplier = 1.2f },
            new TerrainSpeedRule { terrainType = TerrainType.Slow, speedMultiplier = 0.75f },
            new TerrainSpeedRule { terrainType = TerrainType.VerySlow, speedMultiplier = 0.5f }
        };

        [Header("Levels")]
        public List<SubLevelDefinition> subLevels = new();

        public float GetSpeedMultiplier(TerrainType terrainType)
        {
            for (int i = 0; i < terrainSpeedRules.Count; i++)
            {
                if (terrainSpeedRules[i].terrainType == terrainType)
                    return Mathf.Max(0.1f, terrainSpeedRules[i].speedMultiplier);
            }

            return terrainType switch
            {
                TerrainType.Fast => 1.2f,
                TerrainType.Slow => 0.75f,
                TerrainType.VerySlow => 0.5f,
                _ => 1f
            };
        }

        public SubLevelDefinition GetSubLevel(int index)
        {
            for (int i = 0; i < subLevels.Count; i++)
            {
                if (subLevels[i].subLevelIndex == index)
                    return subLevels[i];
            }

            return null;
        }
    }
}
