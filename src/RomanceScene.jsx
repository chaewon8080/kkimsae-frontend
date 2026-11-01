const money = (value) =>
  `${value.toLocaleString('ko-KR')}원`;

export default function RomanceScene({ scene }) {
  if (scene.kind === 'romanceProfile') {
    return (
      <div className="romancePanel">
        <p className="eduEyebrow">SNS 메시지 요청</p>

        <div className="romanceProfileRow">
          <div
            className="romanceAvatar"
            aria-hidden="true"
          >
            A
          </div>

          <div>
            <h3>Alex</h3>
            <p>한국 여행을 준비 중인 사용자</p>
          </div>
        </div>

        <div className="romanceMessage">
          안녕하세요! 한국에 여행 가려고 하는데
          음식이나 여행지를 추천해 줄 수 있나요?
        </div>

        <p className="eduSmall">
          교육용 가상 인물입니다.
          실제 인물의 사진이나 계정은 사용하지 않습니다.
        </p>
      </div>
    );
  }

  if (scene.kind === 'romanceTime') {
    return (
      <div className="romanceTime">
        <p className="eduEyebrow">시간이 흐른 뒤</p>

        <strong>{scene.timeLabel}</strong>

        <p>{scene.description}</p>

        <div className="romanceMemory">
          <span>일상 이야기</span>
          <span>안부 메시지</span>
          <span>취향과 관심사</span>
        </div>
      </div>
    );
  }

  if (scene.kind === 'romancePay') {
    return (
      <div className="romancePanel">
        <div className="romancePanelHeader">
          <strong>낌새 모의 입금</strong>
          <span>교육용 가상 거래</span>
        </div>

        <p className="romancePurpose">
          {scene.purpose}
        </p>

        <strong className="romanceAmount">
          {money(scene.amount)}
        </strong>

        <dl className="romanceTable">
          <div>
            <dt>현재 가상 은행 잔액</dt>
            <dd>{money(scene.balance)}</dd>
          </div>

          <div>
            <dt>이번 입금액</dt>
            <dd>{money(scene.amount)}</dd>
          </div>

          <div>
            <dt>진행 후 가상 은행 잔액</dt>
            <dd>
              {money(scene.balance - scene.amount)}
            </dd>
          </div>

          <div>
            <dt>전달 경로</dt>
            <dd>상대가 안내한 가상 거래소</dd>
          </div>
        </dl>

        <p className="eduSmall">
          실제 가입·입금·가상자산 거래는 발생하지 않습니다.
          계좌정보나 개인정보도 입력받지 않습니다.
        </p>
      </div>
    );
  }

  if (scene.kind === 'romanceProfit') {
    return (
      <div className="romanceExchange">
        <div className="romancePanelHeader">
          <strong>가상 거래소</strong>
          <span>모의 투자 화면</span>
        </div>

        <p className="romancePurpose">
          사이트에 표시된 평가금액
        </p>

        <strong className="romanceAmount">
          60,000원
        </strong>

        <dl className="romanceTable">
          <div>
            <dt>가상 입금액</dt>
            <dd>50,000원</dd>
          </div>

          <div>
            <dt>사이트에 표시된 증가액</dt>
            <dd>10,000원</dd>
          </div>

          <div>
            <dt>출금 신청 가능 금액</dt>
            <dd>60,000원</dd>
          </div>
        </dl>

        <p className="eduSmall">
          사이트에 표시된 숫자와 실제 받은 돈은 구분됩니다.
          다음 단계에서는 소액 출금이 이뤄진 가상 상황을 체험합니다.
        </p>
      </div>
    );
  }

  if (scene.kind === 'romanceWithdrawn') {
    return (
      <div className="romancePanel">
        <p className="eduEyebrow">낌새 가상은행</p>

        <div className="romanceReceiptIcon" aria-hidden="true">
          +
        </div>

        <h3>60,000원이 입금되었습니다</h3>
        <p className="romanceBodyText">
          거래소에서 신청한 소액 출금이
          은행에 들어온 상황입니다.
        </p>

        <dl className="romanceTable">
          <div>
            <dt>출금 수령액</dt>
            <dd>60,000원</dd>
          </div>

          <div>
            <dt>가상 은행 잔액</dt>
            <dd>4,968,790원</dd>
          </div>
        </dl>

        <p className="eduSmall">
          교육용 가상 입금입니다.
          실제 금전은 지급되지 않습니다.
        </p>
      </div>
    );
  }

  if (scene.kind === 'romanceBlocked') {
    return (
      <div className="romanceExchange">
        <div className="romancePanelHeader">
          <strong>가상 거래소</strong>
          <span>출금 신청</span>
        </div>

        <p className="romancePurpose">
          사이트에 표시된 평가금액
        </p>

        <strong className="romanceAmount">
          1,480,000원
        </strong>

        <div className="romanceBlockedNotice">
          <strong>출금 보류</strong>

          <p>
            정산 조건이 충족되지 않았습니다.
            안내받은 담당자에게 문의해 주세요.
          </p>
        </div>

        <p className="eduSmall">
          화면에 표시된 금액은 가상 사이트의 주장입니다.
          은행에 입금되거나 실제 수익이 확인된 금액이 아닙니다.
        </p>
      </div>
    );
  }

  if (scene.kind === 'romanceGone') {
    return (
      <div>
        <p className="eduSimulationNotice">
          교육용 가상 상황 · 실제 메시지나 거래는 발생하지 않습니다.
        </p>

        <div className="romancePanel">
          <p className="eduEyebrow">며칠 후</p>

          <h3>답장이 오지 않습니다</h3>

          <div className="romanceMessage isMine">
            추가 입금했어요. 출금은 언제 되나요?
          </div>

          <p className="romanceFailed">
            메시지를 전달할 수 없습니다.
          </p>

          <div className="romanceStatus">
            <div>
              <span>상대 프로필</span>
              <strong>접근 불가</strong>
            </div>

            <div>
              <span>거래소 페이지</span>
              <strong>연결 불가</strong>
            </div>

            <div>
              <span>고액 입금 이후 출금</span>
              <strong>미수령</strong>
            </div>
          </div>

          <div className="romanceLoss">
            <h4>가상 거래 내역</h4>

            <dl className="romanceTable">
              <div>
                <dt>입금 총액</dt>
                <dd>1,350,000원</dd>
              </div>

              <div>
                <dt>소액 출금 수령액</dt>
                <dd>60,000원</dd>
              </div>

              <div>
                <dt>순손실</dt>
                <dd>1,290,000원</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  }

  return null;
}