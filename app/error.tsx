'use client';

import { ErrorScreen } from '@/components/desk/ErrorScreen';

/**
 * 렌더 중 오류가 나면 Next가 이 컴포넌트를 대신 그린다.
 * 흰 화면 대신 종료 화면과 같은 모양으로 보이고, 전원 버튼이 처음부터 다시 시작한다.
 * 3D 씬은 부분 재시도(reset)보다 새로 고침이 확실해서 reset은 쓰지 않는다.
 */
export default function Error({ error }: { error: Error & { digest?: string } }) {
  return <ErrorScreen code={error.digest} />;
}
