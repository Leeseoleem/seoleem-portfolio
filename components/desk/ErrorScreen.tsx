'use client';

import { PowerButton } from './PowerButton';

/**
 * 오류 화면. 종료 화면과 같은 모양(검은 화면, 문구, 전원 버튼)이고 문구만 다르다.
 * 흰 화면으로 죽는 대신 "전원이 나갔다"로 보이게 한다. 버튼은 처음부터 다시 시작한다.
 *
 * 쓰이는 곳 셋: app/error.tsx(렌더 오류), app/global-error.tsx(루트 레이아웃 오류),
 * DeskExperience(WebGL 컨텍스트 소실).
 */
export function ErrorScreen({ code }: { code?: string }) {
  const restart = () => window.location.reload();
  return (
    <div className="off-screen is-visible" role="alert">
      <div className="closing is-visible">
        <p className="closing-title">예상치 못한 오류로 전원이 나갔습니다.</p>
        <p className="closing-sub">다시 켜면 처음부터 시작합니다.</p>
        <PowerButton label="다시 켜기" onClick={restart} />
        <p className="closing-hint">seoleem desk{code ? ` · ${code}` : ''}</p>
      </div>
    </div>
  );
}
