// Namespace: StarfallContinent.Core
// Locked 2.5D camera rig controller using a 45-degree-style top-down perspective.
using UnityEngine;

namespace StarfallContinent.Core
{
    public sealed class CameraController : MonoBehaviour
    {
        [Header("Follow")]
        public Transform target;
        public float followSmoothTime = 0.12f;
        public Vector3 worldOffset;

        [Header("Rig Camera Setup")]
        public Camera rigCamera;
        public Vector3 cameraLocalPosition = new(0f, 12f, -8f);
        public Vector3 cameraLocalEulerAngles = new(50f, 0f, 0f);

        private Vector3 velocity;

        private void Awake()
        {
            if (rigCamera == null)
                rigCamera = GetComponentInChildren<Camera>();

            ApplyCameraPose();
        }

        private void LateUpdate()
        {
            if (target == null)
                return;

            Vector3 desired = target.position + worldOffset;
            transform.position = Vector3.SmoothDamp(transform.position, desired, ref velocity, followSmoothTime);
        }

        [ContextMenu("Apply Camera Pose")]
        public void ApplyCameraPose()
        {
            if (rigCamera == null)
                return;

            Transform cameraTransform = rigCamera.transform;
            cameraTransform.SetParent(transform, false);
            cameraTransform.localPosition = cameraLocalPosition;
            cameraTransform.localRotation = Quaternion.Euler(cameraLocalEulerAngles);
        }
    }
}
