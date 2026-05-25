// Namespace: StarfallContinent.Core
// Shared VFX/SFX helper for hits, deaths, rewards, and camera feedback.
using System.Collections;
using UnityEngine;

namespace StarfallContinent.Core
{
    public sealed class FXManager : MonoBehaviour
    {
        public static FXManager Instance { get; private set; }

        [Header("Default Effects")]
        public GameObject hitEffectPrefab;
        public GameObject deathEffectPrefab;
        public GameObject rewardEffectPrefab;

        [Header("Camera Shake")]
        public CameraController cameraController;
        public float shakeFrequency = 35f;

        private Coroutine shakeRoutine;
        private Vector3 baseCameraOffset;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            if (cameraController == null)
                cameraController = FindFirstObjectByType<CameraController>();
        }

        public void PlayHit(Vector3 position) => Spawn(hitEffectPrefab, position);
        public void PlayDeath(Vector3 position) => Spawn(deathEffectPrefab, position);
        public void PlayReward(Vector3 position) => Spawn(rewardEffectPrefab, position);

        public GameObject Spawn(GameObject prefab, Vector3 position, Quaternion rotation = default)
        {
            if (prefab == null)
                return null;

            Quaternion finalRotation = rotation == default ? Quaternion.identity : rotation;
            GameObject instance = Instantiate(prefab, position, finalRotation);
            Destroy(instance, 4f);
            return instance;
        }

        public void ShakeCamera(float duration = 0.15f, float amplitude = 0.25f)
        {
            if (cameraController == null)
                return;

            if (shakeRoutine != null)
                StopCoroutine(shakeRoutine);

            shakeRoutine = StartCoroutine(ShakeRoutine(duration, amplitude));
        }

        private IEnumerator ShakeRoutine(float duration, float amplitude)
        {
            baseCameraOffset = cameraController.worldOffset;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float decay = 1f - Mathf.Clamp01(elapsed / duration);
                float x = Mathf.Sin(Time.time * shakeFrequency) * amplitude * decay;
                float z = Mathf.Cos(Time.time * shakeFrequency * 0.85f) * amplitude * decay;
                cameraController.worldOffset = baseCameraOffset + new Vector3(x, 0f, z);
                yield return null;
            }

            cameraController.worldOffset = baseCameraOffset;
            shakeRoutine = null;
        }
    }
}
