/**
 * 책상 위 오브젝트를 끌고 있는 동안 카메라 회전을 막는다.
 * 카메라 회전은 캔버스에 붙은 네이티브 포인터 이벤트라서 R3F의 stopPropagation으로는 막히지 않는다.
 */
export const dragLock = { active: false };
