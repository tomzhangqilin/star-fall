// StarfallContinent - Core/GameManager.cs
// Singleton that owns the game-state machine and chapter/level progression.
// Persists across scene loads; place on a root GameObject in your bootstrap scene.
using System;
using UnityEngine;
using UnityEngine.SceneManagement;
using StarfallContinent.Data;

namespace StarfallContinent.Core
{
    public enum GameState
    {
        MainMenu,
        Playing,
        Shop,
        BossRoom,
        Paused,
        GameOver,
        Victory
    }

    public sealed class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Chapters - assign 5 ChapterData assets in order")]
        [SerializeField] private ChapterData[] chapters;

        [Header("Scene Names")]
        [SerializeField] private string mainMenuScene = "MainMenu";
        [SerializeField] private string gameplayScene = "Gameplay";

        [Header("Development")]
        [SerializeField] private bool autoStartInCurrentScene = true;

        public int CurrentChapter { get; private set; }
        public int CurrentLevel { get; private set; }
        public GameState State { get; private set; } = GameState.MainMenu;
        public bool IsBossLevel => CurrentLevel == 4;

        public ChapterData ActiveChapter =>
            chapters != null && chapters.Length > 0
                ? chapters[Mathf.Clamp(CurrentChapter, 0, chapters.Length - 1)]
                : null;

        public static event Action<GameState> OnGameStateChanged;
        public static event Action<int, int> OnLevelChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            if (!autoStartInCurrentScene || State != GameState.MainMenu)
                return;

            CurrentChapter = 0;
            CurrentLevel = 0;
            OnLevelChanged?.Invoke(CurrentChapter, CurrentLevel);
            ChangeState(GameState.Playing);
        }

        public void StartNewGame()
        {
            CurrentChapter = 0;
            CurrentLevel = 0;
            SceneManager.LoadScene(gameplayScene);
            OnLevelChanged?.Invoke(CurrentChapter, CurrentLevel);
            ChangeState(GameState.Playing);
        }

        public void CompleteLevel()
        {
            if (IsBossLevel)
            {
                if (CurrentChapter >= 4)
                {
                    ChangeState(GameState.Victory);
                    return;
                }

                CurrentChapter++;
                CurrentLevel = 0;
            }
            else
            {
                CurrentLevel++;
            }

            OnLevelChanged?.Invoke(CurrentChapter, CurrentLevel);
            ChangeState(GameState.Shop);
        }

        public void ExitShop()
        {
            ChangeState(IsBossLevel ? GameState.BossRoom : GameState.Playing);
        }

        public void TriggerGameOver()
        {
            ChangeState(GameState.GameOver);
        }

        public void PauseGame()
        {
            Time.timeScale = 0f;
            ChangeState(GameState.Paused);
        }

        public void ResumeGame()
        {
            Time.timeScale = 1f;
            ChangeState(IsBossLevel ? GameState.BossRoom : GameState.Playing);
        }

        public void ReturnToMainMenu()
        {
            Time.timeScale = 1f;
            ChangeState(GameState.MainMenu);
            SceneManager.LoadScene(mainMenuScene);
        }

        private void ChangeState(GameState next)
        {
            State = next;
            OnGameStateChanged?.Invoke(next);
        }
    }
}
