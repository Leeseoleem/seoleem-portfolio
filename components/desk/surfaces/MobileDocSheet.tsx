'use client';

import { useDeskStore } from '@/stores/useDeskStore';
import { getSound } from '@/lib/desk/sound';
import { useIsMobile } from '@/lib/desk/use-mobile';
import { DocumentSheets } from './DocumentSheets';

/**
 * 모바일에서 서류를 확대했을 때. 3D 안의 600×840 종이는 작은 화면에서 글자가 읽히지 않는다.
 *
 * 창틀 없이 화면을 그대로 채운다. 이력서는 읽는 것이 전부라 종이를 크게 쓰는 편이 낫다.
 * 3D 쪽 서류 화면은 Documents가 모바일에서 아예 그리지 않는다. 둘 다 떠 있으면 방향키와 소리가 겹친다.
 */
export function MobileDocSheet() {
  const mobile = useIsMobile();
  const zoomed = useDeskStore((s) => s.zoomed);
  const phase = useDeskStore((s) => s.phase);
  const backToDesk = useDeskStore((s) => s.backToDesk);

  if (!mobile || zoomed !== 'docs' || (phase !== 'zoomed' && phase !== 'transition')) return null;

  const close = () => {
    getSound().play('click');
    backToDesk();
  };

  return (
    <div className="doc-full" role="dialog" aria-modal="true" aria-label="이력서">
      <DocumentSheets />
      <button type="button" className="doc-full__close" onClick={close} aria-label="책상으로">
        ✕
      </button>
    </div>
  );
}
