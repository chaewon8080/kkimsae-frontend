import { useEffect, useState } from 'react';

const money = (value) =>
  `${value.toLocaleString('ko-KR')}원`;

const goneSteps = [
  {
    title: '정산을 요청했습니다',
    text: '나: 입금했습니다. 이제 출금해 주세요.',
  },
  {
    title: '메시지 전송 실패',
    text: '매니저에게 보낸 메시지가 전달되지 않습니다.',
  },
  {
    title: '대화방 접근 불가',
    text: '구매 미션 7팀 대화방에 접근할 수 없습니다.',
  },
  {
    title: '사이트 연결 불가',
    text: '정산 내역을 확인하던 페이지에도 연결할 수 없습니다.',
  },
];

function GoneScene({ onComplete }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  const [reducedMotion] = useState(() =>
    window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches || false
  );

  const complete =
    step === goneSteps.length - 1;

  useEffect(() => {
    if (paused || reducedMotion || complete) return;

    const timer = window.setTimeout(() => {
      setStep((value) => value + 1);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [step, paused, reducedMotion, complete]);

  return (
    <div>
      <p className="eduSimulationNotice">
        교육용 가상 상황 · 실제 메시지나 거래는 발생하지 않습니다.
      </p>

      <div className="teamGoneBody">
        <p className="eduEyebrow">시간이 흐른 뒤</p>

        <div role="status" aria-live="polite">
          <h3>{goneSteps[step].title}</h3>
          <p>{goneSteps[step].text}</p>
        </div>

        <div className="teamStatusList">
          <div>
            <span>매니저와의 대화</span>
            <strong>
              {step >= 1 ? '전송 실패' : '답변 대기'}
            </strong>
          </div>

          <div>
            <span>구매 미션 7팀</span>
            <strong>
              {step >= 2 ? '접근 불가' : '확인 중'}
            </strong>
          </div>

          <div>
            <span>정산 사이트</span>
            <strong>
              {step >= 3 ? '연결 불가' : '확인 중'}
            </strong>
          </div>
        </div>

        {complete && (
          <div className="teamLossSummary">
            <h4>가상 거래 내역</h4>

            <dl>
              <div>
                <dt>체험 보상</dt>
                <dd>+20,000원</dd>
              </div>
              <div>
                <dt>첫 구매 미션</dt>
                <dd>−100,000원</dd>
              </div>
              <div>
                <dt>복구 미션</dt>
                <dd>−300,000원</dd>
              </div>
              <div>
                <dt>마지막 미션</dt>
                <dd>−1,000,000원</dd>
              </div>
              <div className="teamNetLoss">
                <dt>순손실</dt>
                <dd>1,380,000원</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <div className="eduButtons teamSceneActions">
        {!complete && (
          <>
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? '자동 재생 계속' : '일시 정지'}
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setStep((value) =>
                  Math.min(value + 1, goneSteps.length - 1)
                )
              }
            >
              다음 장면 →
            </button>
          </>
        )}

        <button type="button" onClick={onComplete}>
          {complete
            ? '결과와 내 선택 보기'
            : '연출 건너뛰고 결과 보기'}
        </button>
      </div>
    </div>
  );
}

export default function TeamMissionScene({
  scene,
  onChoose,
}) {
  if (scene.kind === 'teamAd') {
    return (
      <div className="teamAd">
        <p className="teamAdLabel">SNS 광고 · 가상 화면</p>

        <h3>
          하루 10분,
          <br />
          상품 리뷰 도우미 모집
        </h3>

        <p>
          상품을 확인하고 간단한 작업을 완료하면
          보상을 드립니다.
        </p>

        <div className="teamAdTags">
          <span>초보자 가능</span>
          <span>당일 정산</span>
          <span>재택 활동</span>
        </div>

        <p className="eduSmall">
          실제 모집 광고가 아닌 교육용 가상 화면입니다.
        </p>
      </div>
    );
  }

  if (scene.kind === 'teamTask') {
    return (
      <div className="teamTask">
        <div className="teamProduct">
          <div className="teamProductImage" aria-hidden="true">
            상품
          </div>

          <div>
            <p className="eduEyebrow">체험 작업</p>
            <h3>데일리 머그컵</h3>
            <p>상품 확인 → 관심 등록 → 캡처 전달</p>
          </div>
        </div>

        <div className="teamTaskNotice">
          아래 ‘가상 작업을 완료하고 캡처를 보낸다’를
          누르면 작업을 완료한 상황으로 진행됩니다.
        </div>

        <p className="eduSmall">
          실제 쇼핑몰에 접속하거나 사진을 업로드하지 않습니다.
          계좌정보도 입력받지 않습니다.
        </p>
      </div>
    );
  }

  if (scene.kind === 'teamReward') {
    return (
      <div className="teamReward">
        <p className="eduEyebrow">낌새 가상은행</p>

        <div className="teamRewardIcon" aria-hidden="true">
          +
        </div>

        <h3>20,000원이 입금되었습니다</h3>
        <p>입금자: 체험보상</p>

        <dl className="teamMoneyTable">
          <div>
            <dt>입금액</dt>
            <dd>20,000원</dd>
          </div>

          <div>
            <dt>입금 후 가상 잔액</dt>
            <dd>4,978,790원</dd>
          </div>
        </dl>

        <p className="eduSmall">
          교육용 가상 입금입니다. 실제 보상은 지급되지 않습니다.
        </p>
      </div>
    );
  }

  if (scene.kind === 'teamPayment') {
    return (
      <div className="teamPayment">
        <div className="teamPaymentHeader">
          <strong>낌새 모의 결제</strong>
          <span>교육용 가상 거래</span>
        </div>

        <p className="teamPaymentPurpose">{scene.purpose}</p>

        <strong className="teamPaymentAmount">
          {money(scene.amount)}
        </strong>

        <dl className="teamMoneyTable">
          <div>
            <dt>현재 가상 잔액</dt>
            <dd>{money(scene.balance)}</dd>
          </div>

          <div>
            <dt>이전까지 보낸 금액</dt>
            <dd>{money(scene.sentBefore)}</dd>
          </div>

          <div>
            <dt>이번에 보낼 금액</dt>
            <dd>{money(scene.amount)}</dd>
          </div>

          <div>
            <dt>진행 후 누적 입금액</dt>
            <dd>
              {money(scene.sentBefore + scene.amount)}
            </dd>
          </div>

          <div>
            <dt>진행 후 가상 잔액</dt>
            <dd>
              {money(scene.balance - scene.amount)}
            </dd>
          </div>
        </dl>

        <p className="eduSmall">
          매니저가 안내한 구매·입금 단계를 흉내 낸 화면입니다.
          실제 결제나 송금은 발생하지 않습니다.
        </p>
      </div>
    );
  }

  if (scene.kind === 'teamGone') {
    return (
      <GoneScene
        onComplete={() => onChoose(scene.choices[0])}
      />
    );
  }

  return null;
}