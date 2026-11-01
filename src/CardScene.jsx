import { useEffect, useState } from 'react';

function TransferDone({ onComplete }) {
  const [complete, setComplete] =
    useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setComplete(true);
    }, 1800);

    return () =>
      window.clearTimeout(timer);
  }, []);

  return (
    <div className="cardTransferResult">
      <p className="eduSimulationNotice">
        교육용 가상 거래 · 실제 송금은 발생하지 않습니다.
      </p>

      <div
        className="cardTransferResultBody"
        role="status"
        aria-live="polite"
      >
        <div
          className="cardResultIcon"
          aria-hidden="true"
        >
          {complete ? '✓' : '…'}
        </div>

        <h3>
          {complete
            ? '4,000,000원이 송금되었습니다'
            : '송금 처리 중'}
        </h3>

        <p>
          {complete
            ? '가상 수취인에게 송금이 완료됐습니다.'
            : '모의 송금 결과를 확인하고 있습니다.'}
        </p>

        {complete && (
          <dl className="cardTransferDetails">
            <div>
              <dt>받는 은행</dt>
              <dd>가상은행</dd>
            </div>

            <div>
              <dt>받는 사람</dt>
              <dd>가상 수취인</dd>
            </div>

            <div>
              <dt>송금 금액</dt>
              <dd>4,000,000원</dd>
            </div>

            <div>
              <dt>남은 잔액</dt>
              <dd>958,790원</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="eduButtons cardResultActions">
        <button
          type="button"
          onClick={onComplete}
        >
          {complete
            ? '결과와 내 선택 보기'
            : '연출 건너뛰고 결과 보기'}
        </button>
      </div>
    </div>
  );
}

export default function CardScene({
  scene,
  onChoose,
}) {
  if (scene.kind === 'cardSms') {
    return (
      <div className="cardSms">
        <div className="cardSmsHeader">
          <strong>메시지</strong>
          <span>알 수 없는 발신자</span>
        </div>

        <div className="cardSmsBubble">
          <p>[Web발신]</p>

          <p>
            [○○카드] 해외 결제 승인 안내
          </p>

          <strong className="cardPaymentAmount">
            USD 780.00
          </strong>

          <p>
            본인 이용이 아닌 경우
            아래 번호로 문의해 주세요.
          </p>

          <button
            type="button"
            className="cardNumberLink"
            onClick={() =>
              onChoose(scene.choices[0])
            }
          >
            문의: 000-0000-0000
          </button>
        </div>

        <p className="eduSmall">
          교육용 가상 문자와 번호입니다.
          버튼을 눌러도 실제 전화가 걸리지 않습니다.
        </p>
      </div>
    );
  }

  if (
    scene.kind === 'cardOutgoing'
  ) {
    return (
      <div className="cardOutgoing">
        <p className="cardOutgoingCaption">
          {scene.caption}
        </p>

        <div
          className="cardPhoneIcon"
          aria-hidden="true"
        >
          ☎
        </div>

        <p className="cardOutgoingNumber">
          {scene.number}
        </p>

        <p>
          아래 ‘전화 걸기’를 눌러
          가상 통화를 시작하세요.
        </p>

        <p className="eduSmall">
          교육용 전화 화면입니다.
          실제 전화 연결은 발생하지 않습니다.
        </p>
      </div>
    );
  }

  if (
    scene.kind === 'cardTransfer'
  ) {
    return (
      <div className="cardBank">
        <div className="cardBankHeader">
          <strong>낌새 가상은행</strong>
          <span>송금</span>
        </div>

        <p className="cardBalanceLabel">
          내 계좌 잔액
        </p>

        <strong className="cardBalance">
          4,958,790원
        </strong>

        <dl className="cardTransferDetails">
          <div>
            <dt>받는 은행</dt>
            <dd>가상은행</dd>
          </div>

          <div>
            <dt>받는 계좌</dt>
            <dd>XXX-XXXX-XXXX</dd>
          </div>

          <div>
            <dt>받는 사람</dt>
            <dd>가상 수취인</dd>
          </div>

          <div>
            <dt>송금 금액</dt>
            <dd className="cardTransferAmount">
              4,000,000원
            </dd>
          </div>

          <div>
            <dt>송금 후 잔액</dt>
            <dd>958,790원</dd>
          </div>
        </dl>

        <div className="cardClaim">
          통화 상대는 이 계좌를
          ‘자산 보호용’이라고 설명했습니다.
        </div>

        <p className="eduSmall">
          모든 계좌와 수취인은 가상입니다.
          실제 계좌번호나 금융정보를
          입력하지 않습니다.
        </p>
      </div>
    );
  }

  if (
    scene.kind === 'cardTransferDone'
  ) {
    return (
      <TransferDone
        onComplete={() =>
          onChoose(scene.choices[0])
        }
      />
    );
  }

  return null;
}