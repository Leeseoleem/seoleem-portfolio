/** 전원 기호 버튼. 종료 화면과 오류 화면이 같은 버튼을 쓴다 */
export function PowerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="power-btn" aria-label={label} onClick={onClick}>
      <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true">
        <path d="M24 6v18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M14.5 12.5a15 15 0 1 0 19 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
    </button>
  );
}
