import { useEffect, useState } from 'react';
import { trafficLookupChoice } from './trafficScenario';

const leakSteps = [
  {
    title: '프로그램이 설치되었습니다',
    description:
      '설치 이후 사진 접근 권한 등이 허용된 상황을 가정합니다.',
  },
  {
    title: '가상 앨범이 열립니다',
    description:
      '아래 사진들은 교육용으로 만든 가상 자료입니다.',
  },
  {
    title: '개인정보가 포함된 사진에 접근',
    description:
      '신분증과 개인정보 서류 사진이 선택됩니다.',
  },
  {
    title: '사진이 외부로 전송됩니다',
    description:
      '사진에 포함된 개인정보가 상대에게 넘어갔습니다.',
  },
  {
    title: '이후…',
    description:
      '탈취된 정보가 추가 범죄에 악용되고, 추가 인증정보 탈취 등이 결합해 금융 피해로 이어진 상황을 가정합니다.',
  },
  {
    title: '본인이 진행하지 않은 거래',
    description:
      '가상 은행에서 출금 알림이 도착했습니다.',
  },
];

function TrafficLeak({ onComplete }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  const [reducedMotion] = useState(() =>
    typeof window.matchMedia === 'function'
      ? window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches
      : false
  );

  const complete =
    step === leakSteps.length - 1;

  useEffect(() => {
    if (
      paused ||
      reducedMotion ||
      complete
    ) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        setStep((value) => value + 1);
      },
      step === 0 || step === 4
        ? 4800
        : 2600
    );

    return () =>
      window.clearTimeout(timer);
  }, [
    step,
    paused,
    reducedMotion,
    complete,
  ]);

  function nextStep() {
    setStep((value) =>
      Math.min(
        value + 1,
        leakSteps.length - 1
      )
    );
  }

  return (
    <div className="trafficLeak">
      <p className="eduSimulationNotice">
        교육용 자동 연출 · 실제 사진 접근·업로드·금융 거래는 발생하지 않습니다.
      </p>

      <div className="trafficLeakBody">
        <div
          className="trafficLeakHeading"
          role="status"
          aria-live="polite"
        >
          <p className="eduEyebrow">
            교육용 가상 상황
          </p>

          <h3>{leakSteps[step].title}</h3>

          <p>
            {leakSteps[step].description}
          </p>
        </div>

        {step === 0 && (
          <div className="trafficInstalled">
            <span aria-hidden="true">✓</span>
            <strong>
              교통민원 조회 프로그램
            </strong>
            <p>모의 설치 완료</p>
          </div>
        )}

        {step >= 1 && step <= 3 && (
          <div className="trafficAlbum">
            <div className="trafficAlbumHeader">
              <strong>사진</strong>
              <span>교육용 가상 앨범</span>
            </div>

            <div className="trafficPhotoGrid">
              <div className="trafficPhoto">
                <span
                  className="trafficPhotoSymbol"
                  aria-hidden="true"
                >
                  산
                </span>
                <span>여행 사진</span>
              </div>

              <div className="trafficPhoto">
                <span
                  className="trafficPhotoSymbol"
                  aria-hidden="true"
                >
                  식
                </span>
                <span>음식 사진</span>
              </div>

              <div
                className={`trafficPhoto trafficPrivatePhoto ${
                  step >= 2
                    ? 'isTargeted'
                    : ''
                }`}
              >
                <div className="trafficFakeId">
                  <div className="trafficFakeIdTop">
                    신분증 견본
                  </div>

                  <div className="trafficFakeIdBody">
                    <div className="trafficPortrait">
                      가상
                    </div>

                    <div>
                      <strong>가상 인물</strong>
                      <span>XXXXXX-XXXXXXX</span>
                      <span>교육용 견본</span>
                    </div>
                  </div>
                </div>

                <span>신분증 사진</span>

                {step >= 2 && (
                  <span className="trafficPhotoBadge">
                    {step === 3
                      ? '외부 전송'
                      : '접근됨'}
                  </span>
                )}
              </div>

              <div
                className={`trafficPhoto trafficPrivatePhoto ${
                  step >= 2
                    ? 'isTargeted'
                    : ''
                }`}
              >
                <div className="trafficFakeDocument">
                  <strong>개인정보 서류</strong>

                  <span>이름: 가상 인물</span>
                  <span>연락처: XXX-XXXX-XXXX</span>
                  <span>주소: 교육용 가상 주소</span>

                  <small>교육용 견본</small>
                </div>

                <span>서류 사진</span>

                {step >= 2 && (
                  <span className="trafficPhotoBadge">
                    {step === 3
                      ? '외부 전송'
                      : '접근됨'}
                  </span>
                )}
              </div>
            </div>

            {step === 3 && (
              <div className="trafficLeakAlert">
                <strong>
                  개인정보가 상대에게 넘어갔습니다
                </strong>
                <p>
                  가상 신분증·서류 사진
                  2개가 전송된 상황입니다.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="trafficLater">
            <span>시간 경과</span>

            <p>
              사진 탈취 이후의
              후속 피해 상황으로 넘어갑니다.
            </p>

            <small>
              개인정보 사진이 전송되자마자
              자동으로 돈이 빠져나간다는
              의미는 아닙니다.
            </small>
          </div>
        )}

        {step === 5 && (
          <div className="trafficBankNotice">
            <p className="trafficBankName">
              낌새 가상은행
            </p>

            <p>출금 알림</p>

            <strong>2,000,000원</strong>

            <div className="trafficBankDetail">
              <span>거래 구분</span>
              <span>가상 출금</span>
            </div>

            <div className="trafficBankDetail">
              <span>남은 잔액</span>
              <span>2,958,790원</span>
            </div>

            <p className="trafficUnknownTransaction">
              본인이 진행하지 않은 거래가
              발생한 가상 상황입니다.
            </p>
          </div>
        )}
      </div>

      <div className="eduButtons eduRemoteControls">
        {!complete && (
          <>
            {!reducedMotion && (
              <button
                type="button"
                onClick={() =>
                  setPaused(
                    (value) => !value
                  )
                }
              >
                {paused
                  ? '자동 재생 계속'
                  : '일시 정지'}
              </button>
            )}

            <button
              type="button"
              onClick={nextStep}
            >
              다음 장면 →
            </button>
          </>
        )}

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

export default function TrafficScene({
  scene,
  onChoose,
}) {
  const [numberFilled, setNumberFilled] =
    useState(false);

  if (scene.kind === 'trafficSms') {
    return (
      <div className="trafficSms">
        <div className="trafficSmsHeader">
          <div
            className="trafficSmsIcon"
            aria-hidden="true"
          >
            M
          </div>

          <div>
            <strong>메시지</strong>
            <span>알 수 없는 발신자</span>
          </div>
        </div>

        <div className="trafficSmsBubble">
          <p>[Web발신]</p>

          <p>
            [교통민원24]
            교통법규 위반 관련 고지서가
            발송되었습니다.
          </p>

          <p>
            아래에서 상세 내용을
            확인해 주세요.
          </p>

          <button
            type="button"
            className="trafficMockLink"
            onClick={() =>
              onChoose(scene.choices[0])
            }
          >
            https://traffic-notice.example
          </button>
        </div>

        <p className="eduSmall">
          화면 속 주소는 교육용 예시입니다.
          실제 외부 사이트에 접속하지 않습니다.
        </p>
      </div>
    );
  }

  if (scene.kind === 'trafficLookup') {
    return (
      <div className="eduMockSite">
        <div className="eduMockAddress">
          교육용 가상 페이지 · 외부 접속 없음
        </div>

        <div className="eduMockSiteBody">
          <p className="eduEyebrow">
            교통민원 안내
          </p>

          <h3>미납 과태료 조회</h3>

          <p className="trafficBodyText">
            고지서 상세 내용을 확인하려면
            본인 확인을 진행해 주세요.
          </p>

          <label className="trafficPhoneLabel">
            휴대전화 번호

            <input
              type="text"
              readOnly
              value={
                numberFilled
                  ? '010-0000-0000'
                  : ''
              }
              placeholder="가상 번호를 입력해 주세요"
              aria-describedby="trafficPhoneHelp"
            />
          </label>

          <p
            id="trafficPhoneHelp"
            className="eduSmall"
          >
            실제 전화번호는 입력받지 않습니다.
            아래 버튼으로 가상 번호를 채워주세요.
          </p>

          <div className="eduButtons">
            <button
              type="button"
              onClick={() =>
                setNumberFilled(true)
              }
              disabled={numberFilled}
            >
              {numberFilled
                ? '가상 번호 입력됨'
                : '가상 번호 입력'}
            </button>

            <button
              type="button"
              disabled={!numberFilled}
              onClick={() =>
                onChoose(
                  trafficLookupChoice
                )
              }
            >
              조회하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (
    scene.kind ===
    'trafficAppRequired'
  ) {
    return (
      <div className="eduInstall">
        <div
          className="eduAppIcon"
          aria-hidden="true"
        >
          ↓
        </div>

        <h3>
          모바일 조회 프로그램이 필요합니다
        </h3>

        <p className="trafficBodyText">
          고지서 상세 내용과 위반 내역을
          확인하려면 모바일 조회 프로그램을
          설치해 주세요.
        </p>

        <dl>
          <div>
            <dt>파일 이름</dt>
            <dd>교통민원_조회.apk</dd>
          </div>
        </dl>

        <p className="eduSmall">
          교육용 가상 안내입니다.
          실제 파일은 제공하지 않습니다.
        </p>
      </div>
    );
  }

  if (
    scene.kind ===
    'trafficExplanation'
  ) {
    return (
      <div className="eduMockSite">
        <div className="eduMockAddress">
          교육용 가상 페이지
        </div>

        <div className="eduMockSiteBody">
          <p className="eduEyebrow">
            고객 안내
          </p>

          <h3>프로그램 설치 안내</h3>

          <div className="trafficExplanationBox">
            <p>
              모바일에서는 고지서 상세 내용을
              전용 프로그램으로 제공합니다.
            </p>

            <p>
              프로그램 설치 후 조회를
              계속해 주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (
    scene.kind === 'trafficInstall'
  ) {
    return (
      <div className="eduInstall">
        <div
          className="eduAppIcon"
          aria-hidden="true"
        >
          ↓
        </div>

        <h3>교통민원 조회 프로그램</h3>

        <dl>
          <div>
            <dt>전달 경로</dt>
            <dd>
              문자 링크로 접속한 사이트
            </dd>
          </div>

          <div>
            <dt>파일 이름</dt>
            <dd>교통민원_조회.apk</dd>
          </div>
        </dl>

        <p className="trafficBodyText">
          프로그램을 설치하시겠어요?
        </p>

        <p className="eduSmall">
          설치 과정을 흉내 낸 교육용 화면입니다.
          실제 프로그램을 설치하지 않습니다.
        </p>
      </div>
    );
  }

  if (
    scene.kind === 'trafficLeak'
  ) {
    return (
      <TrafficLeak
        onComplete={() =>
          onChoose(scene.choices[0])
        }
      />
    );
  }

  return null;
}