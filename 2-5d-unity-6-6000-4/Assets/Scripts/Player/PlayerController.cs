// Namespace: StarfallContinent.Player
// Top-down 2.5D movement and Space dodge with invincibility frames.
using System.Collections;
using UnityEngine;

namespace StarfallContinent.Player
{
    [RequireComponent(typeof(PlayerStats))]
    public sealed class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        public Rigidbody body;
        public Transform visualRoot;
        public Transform cameraTransform;
        public float rotationSpeed = 18f;

        [Header("Dodge")]
        public KeyCode dodgeKey = KeyCode.Space;
        public float dodgeDistance = 4f;
        public float dodgeDuration = 0.18f;
        public float invincibleDuration = 0.35f;

        private PlayerStats stats;
        private Vector3 moveInput;
        private Vector3 lastMoveDirection = Vector3.forward;
        private bool isDodging;
        private float nextDodgeTime;

        private void Awake()
        {
            stats = GetComponent<PlayerStats>();
            if (body == null)
                body = GetComponent<Rigidbody>();
            if (cameraTransform == null && Camera.main != null)
                cameraTransform = Camera.main.transform;
        }

        private void Update()
        {
            ReadMovementInput();

            if (Input.GetKeyDown(dodgeKey) && Time.time >= nextDodgeTime && !isDodging)
                StartCoroutine(DodgeRoutine());
        }

        private void FixedUpdate()
        {
            if (isDodging)
                return;

            Vector3 velocity = moveInput * stats.EffectiveMoveSpeed;
            body.linearVelocity = new Vector3(velocity.x, body.linearVelocity.y, velocity.z);
            RotateVisual(moveInput);
        }

        private void ReadMovementInput()
        {
            float horizontal = Input.GetAxisRaw("Horizontal");
            float vertical = Input.GetAxisRaw("Vertical");
            Vector3 raw = GetCameraRelativeInput(horizontal, vertical);
            moveInput = Vector3.ClampMagnitude(raw, 1f);

            if (moveInput.sqrMagnitude > 0.001f)
                lastMoveDirection = moveInput.normalized;
        }

        private Vector3 GetCameraRelativeInput(float horizontal, float vertical)
        {
            if (cameraTransform == null)
                return new Vector3(horizontal, 0f, vertical);

            Vector3 forward = Vector3.ProjectOnPlane(cameraTransform.forward, Vector3.up).normalized;
            Vector3 right = Vector3.ProjectOnPlane(cameraTransform.right, Vector3.up).normalized;
            return right * horizontal + forward * vertical;
        }

        private IEnumerator DodgeRoutine()
        {
            isDodging = true;
            nextDodgeTime = Time.time + stats.dodgeCooldown;
            stats.GrantInvincibility(invincibleDuration);

            Vector3 dodgeDirection = lastMoveDirection.sqrMagnitude > 0.001f ? lastMoveDirection : transform.forward;
            float elapsed = 0f;
            float speed = dodgeDistance / Mathf.Max(0.01f, dodgeDuration);

            while (elapsed < dodgeDuration)
            {
                elapsed += Time.deltaTime;
                body.MovePosition(body.position + dodgeDirection * (speed * Time.deltaTime));
                RotateVisual(dodgeDirection);
                yield return null;
            }

            body.linearVelocity = Vector3.zero;
            isDodging = false;
        }

        private void RotateVisual(Vector3 direction)
        {
            if (visualRoot == null || direction.sqrMagnitude < 0.001f)
                return;

            Quaternion targetRotation = Quaternion.LookRotation(direction, Vector3.up);
            visualRoot.rotation = Quaternion.Slerp(visualRoot.rotation, targetRotation, rotationSpeed * Time.deltaTime);
        }
    }
}
