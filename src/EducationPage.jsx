import { useEffect, useRef, useState } from 'react';
import { educationScenarios } from './educationScenarios';
import './education.css';
import TrafficScene from './TrafficScene';
import CardScene from './CardScene';
import TeamMissionScene from './TeamMissionScene';
import RomanceScene from './RomanceScene';

const formatMoney = (value) =>
  `${value.toLocaleString('ko-KR')}원`;

const remoteSteps = [
  {
    title: '설치 완료',
    description:
      '설치 이후 추가 권한과 금융정보까지 탈취된 상황을 가정합니다.',
  },
  {
    title: '내가 누르지 않았는데…',
    description: '모의 은행 화면이 열립니다.',
  },
  {
    title: '받는 계좌 입력',
    description: '받는 계좌가 자동으로 입력됩니다.',
  },
  {
    title: '이체 금액 입력',
    description: '이체할 금액이 자동으로 입력됩니다.',
  },
  {
    title: '이체 처리 중',
    description: '화면이 자동으로 진행되고 있습니다.',
  },
  {
    title: '이체 완료',
    description: '가상 계좌에서 3,000,000원이 빠져나갔습니다.',
  },
];

const choiceReplies = {
  '소속과 이름을 물어본다':
    '어느 부서 누구신가요? 정말 경찰관이 맞으세요?',

  '직접 확인할 테니 기다려 달라고 한다':
    '제가 경찰서 연락처를 찾아서 확인해 볼게요. 잠시 기다려 주세요.',

  '직원임을 확인할 수 있는지 묻는다':
    '정말 금융감독원 직원이신지 확인할 수 있을까요?',

  '안내대로 현금을 인출하러 간다':
    '알겠습니다. 현금을 인출하러 가겠습니다.',

  '인출하러 간다':
    '알겠습니다. 현금을 인출하러 가겠습니다.',

  '구체적으로 답했으니 안내에 따른다':
    '알겠습니다. 안내해 주신 대로 하겠습니다.',

  '일단 인출만 해 두고 나중에 확인한다':
    '그러면 우선 인출만 해 두겠습니다.',

  '안내받은 사람이니 현금을 전달한다':
    '네. 준비한 현금을 드리겠습니다.',

  '현금을 전달한다':
    '준비한 현금을 드리겠습니다.',

  '신분증을 봤으니 현금을 전달한다':
    '확인했습니다. 현금을 드리겠습니다.',
};

/* 설치 후 원격 조작·이체 연출 */
function RemoteScene({ onComplete }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  const reducedMotion = useRef(
    typeof window.matchMedia === 'function' &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
  );

  const complete = step === remoteSteps.length - 1;
  const currentStep = remoteSteps[step];

  useEffect(() => {
    if (paused || reducedMotion.current || complete) return;

    const timer = window.setTimeout(
      () => {
        setStep((value) => value + 1);
      },
      step === 0 ? 4200 : 2200
    );

    return () => window.clearTimeout(timer);
  }, [step, paused, complete]);

  function nextStep() {
    setStep((value) =>
      Math.min(value + 1, remoteSteps.length - 1)
    );
  }

  return (
    <div className="eduRemote">
      <p className="eduSimulationNotice">
        교육용 자동 연출 · 실제 설치나 금융 거래는 발생하지 않습니다.
      </p>

      <p className="eduAssumption">
        설치 후 추가 권한·금융정보까지 탈취된 상황을 가정합니다.
        설치만으로 항상 즉시 이체되는 것은 아닙니다.
      </p>

      <div className="eduBank" aria-label="가상 은행 화면">
        <div className="eduBankBar">
          <span>낌새 가상은행</span>
          <span>모의 화면</span>
        </div>

        <div role="status" aria-live="polite">
          <p className="eduEyebrow">
            {step === 0 ? '프로그램 설치' : '자동 화면 진행'}
          </p>

          <h3>{currentStep.title}</h3>
          <p>{currentStep.description}</p>
        </div>

        {step >= 1 && (
          <>
            <p className="eduBalanceLabel">
              내 계좌 잔액
            </p>

            <strong className="eduBankBalance">
              {formatMoney(complete ? 1958790 : 4958790)}
            </strong>

            <dl className="eduTransferFields">
              <div>
                <dt>받는 계좌</dt>
                <dd
                  className={
                    step === 2 ? 'eduAutoField' : ''
                  }
                >
                  {step >= 2
                    ? '가상은행 XXX-XXXX-XXXX'
                    : '입력 전'}
                </dd>
              </div>

              <div>
                <dt>이체 금액</dt>
                <dd
                  className={
                    step === 3 ? 'eduAutoField' : ''
                  }
                >
                  {step >= 3
                    ? '3,000,000원'
                    : '입력 전'}
                </dd>
              </div>
            </dl>
          </>
        )}

        {complete && (
          <div className="eduTransferComplete">
            가상 이체 완료 · 3,000,000원
          </div>
        )}
      </div>

      <div className="eduButtons eduRemoteControls">
        {!complete && (
          <>
            {!reducedMotion.current && (
              <button
                type="button"
                onClick={() =>
                  setPaused((value) => !value)
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

/* 교육 공통 화면 */
export default function EducationPage() {
  const [scenarioId, setScenarioId] = useState(null);
  const [current, setCurrent] = useState('intro');
  const [history, setHistory] = useState([]);
  const [visibleCount, setVisibleCount] = useState(1);
  const [selectedReply, setSelectedReply] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const heading = useRef(null);
  const conversation = useRef(null);
  const clickLock = useRef(false);
  const audioContext = useRef(null);

  const scenario = educationScenarios.find(
    (item) => item.id === scenarioId
  );

  const scene = scenario?.scenes[current];
  const ending = scenario?.endings[current];

  // 선택한 말과 다음 장면의 자동 답변이 같으면 중복 표시하지 않습니다.
  const messages = (scene?.messages || []).filter(
    ([speaker, text], index) =>
      !(
        index === 0 &&
        selectedReply &&
        speaker.startsWith('나') &&
        text === selectedReply.text
      )
  );

  const allMessagesVisible =
    visibleCount >= messages.length;

  async function prepareAudio() {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) return;

    try {
      if (
        !audioContext.current ||
        audioContext.current.state === 'closed'
      ) {
        audioContext.current = new AudioContextClass();
      }

      if (
        audioContext.current.state === 'suspended'
      ) {
        await audioContext.current.resume();
      }
    } catch {
      // 소리를 사용할 수 없어도 체험은 진행합니다.
    }
  }

  /* 전화 화면에서만 벨소리 재생 */
  useEffect(() => {
    if (
      scene?.kind !== 'call' ||
      !soundEnabled
    ) {
      return;
    }

    const context = audioContext.current;

    if (
      !context ||
      context.state !== 'running'
    ) {
      return;
    }

    const activeTones = new Set();

    function ring() {
      [660, 880, 660, 880].forEach(
        (frequency, index) => {
          const oscillator =
            context.createOscillator();

          const gain = context.createGain();

          const start =
            context.currentTime + index * 0.24;

          oscillator.frequency.value = frequency;

          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(
            0.035,
            start + 0.02
          );
          gain.gain.linearRampToValueAtTime(
            0,
            start + 0.18
          );

          oscillator.connect(gain);
          gain.connect(context.destination);

          activeTones.add(oscillator);

          oscillator.onended = () => {
            activeTones.delete(oscillator);
            oscillator.disconnect();
            gain.disconnect();
          };

          oscillator.start(start);
          oscillator.stop(start + 0.2);
        }
      );
    }

    ring();

    const interval = window.setInterval(
      ring,
      2300
    );

    return () => {
      window.clearInterval(interval);

      activeTones.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {
          // 이미 종료된 음은 무시합니다.
        }
      });
    };
  }, [
    current,
    scenarioId,
    soundEnabled,
    scene?.kind,
  ]);

  useEffect(() => {
    clickLock.current = false;
    heading.current?.focus();
  }, [current, scenarioId]);

  useEffect(() => {
    if (conversation.current) {
      conversation.current.scrollTop =
        conversation.current.scrollHeight;
    }
  }, [current, visibleCount, selectedReply]);

  useEffect(() => {
    return () => {
      const context = audioContext.current;

      if (
        context &&
        context.state !== 'closed'
      ) {
        context.close().catch(() => {});
      }
    };
  }, []);

  function reset(next = 'intro') {
    clickLock.current = false;
    setHistory([]);
    setSelectedReply(null);
    setVisibleCount(1);
    setCurrent(next);
  }

  async function start() {
    await prepareAudio();
    reset(scenario.startScene);
  }

  function selectScenario(id) {
    reset();
    setScenarioId(id);
  }

  function backToList() {
    reset();
    setScenarioId(null);
  }

  async function toggleSound() {
    if (!soundEnabled) {
      await prepareAudio();
    }

    setSoundEnabled((value) => !value);
  }

  function choose(choice) {
    if (clickLock.current) return;

    clickLock.current = true;

    const [
      label,
      nextScene,
      action,
      feedback,
      reply,
    ] = choice;

    if (action) {
      setHistory((items) => [
        ...items,
        {
          scene: current,
          label,
          action,
          feedback,
        },
      ]);
    }

    const next = scenario.scenes[nextScene];

    const firstMessage =
      next?.messages?.[0];

    const automaticReply =
      firstMessage?.[0]?.startsWith('나')
        ? firstMessage[1]
        : null;

    const spokenReply =
      reply ||
      choiceReplies[label] ||
      automaticReply;

    const showReply =
      next?.kind === 'talk' &&
      label !== '다음' &&
      label !== '통화로 돌아가기';

    setSelectedReply(
      showReply
        ? {
            speaker: spokenReply
              ? '나'
              : '내 선택',
            text: spokenReply || label,
          }
        : null
    );

    setVisibleCount(showReply ? 0 : 1);
    setCurrent(nextScene);
  }

  function renderSceneContent() {
    if (!scene) return null;

     if (scene.kind.startsWith('romance')) {
    return (
      <RomanceScene
        key={`${scenario.id}-${current}`}
        scene={scene}
      />
    );
  }
      if (scene.kind.startsWith('team')) {
    return (
      <TeamMissionScene
        key={`${scenario.id}-${current}`}
        scene={scene}
        onChoose={choose}
      />
    );
  }

      if (scene.kind.startsWith('card')) {
    return (
      <CardScene
        key={`${scenario.id}-${current}`}
        scene={scene}
        onChoose={choose}
      />
    );
  }

      if (scene.kind.startsWith('traffic')) {
    return (
      <TrafficScene
        key={`${scenario.id}-${current}`}
        scene={scene}
        onChoose={choose}
      />
    );
  }

    if (scene.kind === 'call') {
      return (
        <div className="eduPhone eduPhoneRinging">
          <div className="eduPhoneStatus">
            수신 전화 · 모의 화면
          </div>

          <div
            className="eduRingVisual"
            aria-hidden="true"
          >
            <span className="eduRingWave" />
            <span className="eduRingWave eduRingWaveDelayed" />

            <div className="eduRingingIcon">
              ☎
            </div>
          </div>

          <p className="eduCaller">
            {scene.number}
          </p>

          <p>연락처에 없는 번호</p>

          <div className="eduIncomingStatus">
            <span />
            전화가 오고 있습니다
          </div>
        </div>
      );
    }

    if (scene.kind === 'talk') {
      return (
        <div
          className="eduConversation eduConversationLive"
          ref={conversation}
          role="log"
          aria-label="체험 대화"
          aria-live="polite"
          aria-relevant="additions"
        >
          {selectedReply && (
            <div
              className="eduMessage isMine eduMessageEnter"
              key={`${current}-reply`}
            >
              <span>
                {selectedReply.speaker}
              </span>

              <p>{selectedReply.text}</p>
            </div>
          )}

          {messages
            .slice(0, visibleCount)
            .map(
              ([speaker, text], index) => (
                <div
                  className={`eduMessage eduMessageEnter ${
                    speaker.startsWith('나')
                      ? 'isMine'
                      : ''
                  }`}
                  key={`${current}-${index}`}
                >
                  <span>{speaker}</span>
                  <p>{text}</p>
                </div>
              )
            )}
        </div>
      );
    }

    if (scene.kind === 'atm') {
      return (
        <div className="eduAtm">
          <div className="eduAtmHeader">
            낌새 모의 ATM
            <span>현금 인출</span>
          </div>

          <p>인출 정보를 확인해 주세요.</p>

          <dl>
            {[
              ['계좌 잔액', 4958790],
              ['인출 금액', 4900000],
              ['인출 후 잔액', 58790],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{formatMoney(value)}</dd>
              </div>
            ))}
          </dl>

          <p className="eduSmall">
            교육용 화면입니다.
            실제 출금은 발생하지 않습니다.
          </p>
        </div>
      );
    }

    if (
      scene.kind === 'site' ||
      scene.kind === 'siteDetail'
    ) {
      return (
        <div className="eduMockSite">
          <div className="eduMockAddress">
            교육용 가상 페이지 · 외부 접속 없음
          </div>

          <div className="eduMockSiteBody">
            <p className="eduEyebrow">
              물품 확인 서비스
            </p>

            <h3>입국 물품 사건 조회</h3>

            <dl>
              <div>
                <dt>접수번호</dt>
                <dd>C-2026-XXXX</dd>
              </div>

              <div>
                <dt>처리 상태</dt>
                <dd>추가 확인 필요</dd>
              </div>

              <div>
                <dt>확인 내용</dt>
                <dd>금지 물품 관련 조사</dd>
              </div>
            </dl>

            {scene.kind === 'siteDetail' && (
              <div className="eduSiteAlert">
                <h4>명의자 확인 필요</h4>

                <p>
                  접수된 물품에서 마약류로
                  의심되는 물질이 발견되어
                  관련 확인을 진행 중입니다.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (scene.kind === 'install') {
      return (
        <div className="eduInstall">
          <div
            className="eduAppIcon"
            aria-hidden="true"
          >
            ↓
          </div>

          <h3>상대가 보낸 확인 프로그램</h3>

          <dl>
            <div>
              <dt>전달 경로</dt>
              <dd>
                통화 상대가 보낸 문자 링크
              </dd>
            </div>

            <div>
              <dt>파일 이름</dt>
              <dd>물품확인_안내.apk</dd>
            </div>
          </dl>

          <p>프로그램을 설치하시겠어요?</p>

          <p className="eduSmall">
            설치 과정을 흉내 낸 교육용 화면입니다.
            파일을 내려받거나 설치하지 않습니다.
          </p>
        </div>
      );
    }

    if (scene.kind === 'remote') {
      return (
        <RemoteScene
          key={`${scenario.id}-${current}`}
          onComplete={() =>
            choose(scene.choices[0])
          }
        />
      );
    }

    return null;
  }

  return (
    <main className="eduPage">
      <div className="eduTop">
        <span>낌새 대화 교육</span>

        <div className="eduTopRight">
          <span>교육용 가상 체험</span>

          <button
            type="button"
            className="eduSoundToggle"
            aria-pressed={soundEnabled}
            onClick={toggleSound}
          >
            {soundEnabled
              ? '소리 켜짐'
              : '소리 꺼짐'}
          </button>
        </div>
      </div>

      {!scenario ? (
        <section className="eduIntro">
          <p className="eduEyebrow">
            대화로 연습하는 대응
          </p>

          <h2
            tabIndex={-1}
            ref={heading}
          >
            어떤 상황을 체험할까요?
          </h2>

          <p className="eduLead">
            대화를 듣고 선택한 뒤,
            내가 지나온 경로를 돌아보세요.
          </p>

          <div className="eduScenarioList">
            {educationScenarios.map(
              (item, index) => (
                <article key={item.id}>
                  <p className="eduEyebrow">
                    {String(index + 1).padStart(
                      2,
                      '0'
                    )}
                    {' · '}
                    {item.category ||
                      '대화 상황 체험'}
                  </p>

                  <h3>{item.title}</h3>

                  <p>
                    {item.description ||
                      '상대의 말을 듣고 어떻게 행동할지 선택해 보세요.'}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      selectScenario(item.id)
                    }
                  >
                    사례 선택 →
                  </button>
                </article>
              )
            )}
          </div>
        </section>
      ) : current === 'intro' ? (
        <section className="eduIntro">
          <p className="eduEyebrow">
            {scenario.category ||
              '대화 상황 체험'}
          </p>

          <h2
            tabIndex={-1}
            ref={heading}
          >
            {scenario.title}
          </h2>

          <p className="eduLead">
            {scenario.description ||
              '이어지는 연락 속에서 어떻게 행동할지 직접 선택해 보세요.'}
          </p>

          <div className="eduMeta">
            <span>선택에 따라 조기 종료</span>
            <span>마지막에 내 선택 복기</span>
          </div>

          <div className="eduButtons">
            <button
              type="button"
              className="eduPrimary"
              onClick={start}
            >
              체험 시작하기 →
            </button>

            <button
              type="button"
              onClick={backToList}
            >
              사례 목록으로
            </button>
          </div>

          <p className="eduSmall">
            등장인물과 대사는 교육을 위해
            구성했습니다. 실제 전화·사이트
            이동·프로그램 설치·금융 거래는
            발생하지 않습니다.
            <br />
            전화 화면에서 벨소리가 재생되며
            상단에서 끌 수 있습니다.
          </p>
        </section>
      ) : ending ? (
        <section className="eduResult">
          <p className="eduEyebrow">
            체험 완료 · 내 선택 복기
          </p>

          <h2
            tabIndex={-1}
            ref={heading}
          >
            {ending[0]}
          </h2>

          <p className="eduLead">
            {ending[1]}
          </p>

          <h3>내가 지나온 선택</h3>

          <ol className="eduReview">
            {history.map((item, index) => (
              <li
                key={`${item.scene}-${index}`}
              >
                <span className="eduReviewNumber">
                  {String(index + 1).padStart(
                    2,
                    '0'
                  )}
                </span>

                <div>
                  <h4>{item.action}</h4>
                  <p>{item.feedback}</p>
                </div>
              </li>
            ))}
          </ol>

          <section className="eduLesson">
            <h3>이 상황에서 기억할 점</h3>

            {(scenario.lessons || []).map(
              (lesson, index) => (
                <p key={index}>{lesson}</p>
              )
            )}
          </section>

          <div className="eduButtons">
            <button
              type="button"
              className="eduPrimary"
              onClick={start}
            >
              다른 선택으로 다시 해보기
            </button>

            <button
              type="button"
              onClick={backToList}
            >
              다른 사례 선택
            </button>
          </div>
        </section>
      ) : scene ? (
        <>
          <section className="eduStage">
            <div className="eduStageHeading">
              <h2
                tabIndex={-1}
                ref={heading}
              >
                {scene.title}
              </h2>
            </div>

            {renderSceneContent()}

{![
  'remote',
  'trafficLeak',
  'cardTransferDone',
    'teamGone',

].includes(scene.kind) && (             <div className="eduDecision">
                {scene.kind === 'talk' &&
                !allMessagesVisible ? (
                  <div className="eduDialogueControl">
                    <span>
                      대화를 이어서 확인해 보세요.
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount(
                          (count) =>
                            Math.min(
                              count + 1,
                              messages.length
                            )
                        )
                      }
                    >
                      {visibleCount === 0
                        ? '상대의 답변 보기'
                        : '다음 대사'}
                      {' →'}
                    </button>
                  </div>
                ) : (
                  <>
                    <p>
                      {scene.choices.length > 1
                        ? '어떻게 하시겠어요?'
                        : '이어서 진행해 보세요.'}
                    </p>

                    <div className="eduButtons">
                      {scene.choices.map(
                        (choice) => (
                          <button
                            type="button"
                            key={choice[0]}
                            onClick={() =>
                              choose(choice)
                            }
                          >
                            {choice[0]}
                            {scene.choices
                              .length === 1
                              ? ' →'
                              : ''}
                          </button>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          <button
            type="button"
            className="eduExit"
            onClick={() => reset()}
          >
            체험 나가기
          </button>
        </>
      ) : null}
    </main>
  );
}