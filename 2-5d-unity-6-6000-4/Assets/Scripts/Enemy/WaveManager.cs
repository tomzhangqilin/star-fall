// Namespace: StarfallContinent.Enemy
// Spawns configured waves and reports level completion.
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using StarfallContinent.Core;
using StarfallContinent.Data;

namespace StarfallContinent.Enemy
{
    public sealed class WaveManager : MonoBehaviour
    {
        [Header("Spawn Points")]
        public List<Transform> spawnPoints = new();
        public float spawnRadiusFallback = 16f;

        private readonly List<EnemyController> aliveEnemies = new();
        private Coroutine levelRoutine;
        private bool spawningComplete;
        private int startedChapter = -1;
        private int startedLevel = -1;

        private void OnEnable()
        {
            GameManager.OnGameStateChanged += HandleGameStateChanged;
        }

        private void OnDisable()
        {
            GameManager.OnGameStateChanged -= HandleGameStateChanged;
        }

        public void BeginLevel(ChapterData chapterData, int subLevelIndex)
        {
            if (levelRoutine != null)
                StopCoroutine(levelRoutine);

            ClearEnemies();
            levelRoutine = StartCoroutine(LevelRoutine(chapterData, subLevelIndex));
        }

        private IEnumerator LevelRoutine(ChapterData chapterData, int subLevelIndex)
        {
            spawningComplete = false;
            SubLevelDefinition level = chapterData != null ? chapterData.GetSubLevel(subLevelIndex) : null;

            if (level == null)
            {
                Debug.LogWarning($"No wave data for chapter {chapterData?.chapterIndex}, sub-level {subLevelIndex}.");
                spawningComplete = true;
                yield break;
            }

            for (int waveIndex = 0; waveIndex < level.waves.Count; waveIndex++)
            {
                WaveDefinition wave = level.waves[waveIndex];
                yield return new WaitForSeconds(wave.delayBeforeWave);

                for (int entryIndex = 0; entryIndex < wave.enemies.Count; entryIndex++)
                {
                    EnemySpawnEntry entry = wave.enemies[entryIndex];
                    for (int count = 0; count < entry.count; count++)
                    {
                        SpawnEnemy(entry.enemyPrefab);
                        yield return new WaitForSeconds(entry.spawnInterval);
                    }
                }
            }

            if (level.IsBossLevel && level.bossPrefab != null)
                SpawnEnemy(level.bossPrefab);

            spawningComplete = true;
        }

        private void Update()
        {
            aliveEnemies.RemoveAll(enemy => enemy == null || enemy.IsDead);

            bool combatState = GameManager.Instance != null &&
                (GameManager.Instance.State == GameState.Playing || GameManager.Instance.State == GameState.BossRoom);

            if (spawningComplete && aliveEnemies.Count == 0 && combatState)
                GameManager.Instance.CompleteLevel();
        }

        private void SpawnEnemy(GameObject prefab)
        {
            if (prefab == null)
                return;

            Vector3 position = GetSpawnPosition();
            GameObject enemyObject = Instantiate(prefab, position, Quaternion.identity);
            if (enemyObject.TryGetComponent(out EnemyController enemy))
            {
                aliveEnemies.Add(enemy);
                enemy.Died += HandleEnemyDied;
            }
        }

        private Vector3 GetSpawnPosition()
        {
            if (spawnPoints.Count > 0)
            {
                Transform point = spawnPoints[Random.Range(0, spawnPoints.Count)];
                return point.position;
            }

            Vector2 circle = Random.insideUnitCircle.normalized * spawnRadiusFallback;
            return transform.position + new Vector3(circle.x, 0f, circle.y);
        }

        private void HandleEnemyDied(EnemyController enemy)
        {
            enemy.Died -= HandleEnemyDied;
            aliveEnemies.Remove(enemy);
        }

        private void ClearEnemies()
        {
            for (int i = aliveEnemies.Count - 1; i >= 0; i--)
            {
                if (aliveEnemies[i] != null)
                    Destroy(aliveEnemies[i].gameObject);
            }

            aliveEnemies.Clear();
        }

        private void HandleGameStateChanged(GameState state)
        {
            if (state != GameState.Playing && state != GameState.BossRoom)
                return;

            GameManager manager = GameManager.Instance;
            if (manager == null)
                return;

            if (startedChapter == manager.CurrentChapter && startedLevel == manager.CurrentLevel)
                return;

            startedChapter = manager.CurrentChapter;
            startedLevel = manager.CurrentLevel;
            BeginLevel(manager.ActiveChapter, manager.CurrentLevel + 1);
        }
    }
}
