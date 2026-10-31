import { useEffect, useRef, useState } from 'react';
import { educationScenarios } from './educationScenarios';
import './education.css';

// 선택지를 실제 대화 문장으로 표시합니다.
// 여기에 없는 선택지는 버튼 문구 그대로 표시합니다.
const choiceReplies = {
  '소속과 이름을 물어본다':
    '어느 부서 누구신가요? 정말 경찰관이 맞으세요?',

  '직접 확인할 테니 기다려 달라고 한다':
    '제가 경찰서 연락처를 찾아서 확인해 볼게요. 잠시 기다려 주세요.',

  '직원임을 확인할 수 있는지 묻는다':
    '정말 금융감독원 직원이신지 확인할 수 있을까요?',

  '안내대로 현금을 인출하러 간다':
    '알겠습니다. 현금을 인출하러 가겠습니다.',

  '구체적으로 답했으니 안내에 따른다':
    '알겠습니다. 안내해 주신 대로 하겠습니다.',

  '일단 인출만 해 두고 나중에 확인한다':
    '그러면 우선 인출만 해 두겠습니다.',

  '안내받은 사람이니 현금을 전달한다':
    '네. 준비한 현금을 드리겠습니다.',

  '신분증을 봤으니 현금을 전달한다':
    '확인했습니다. 현금을 드리겠습니다.',
};

function formatMoney(value) {
  return `${value.toLocaleString('ko-KR')}원`;
}

export default function EducationPage() {
  const scenario = educationScenarios[0];
  const { scenes, endings } = scenario;

  const [current, setCurrent] = useState('intro');
  const [history, setHistory] = useState([]);
  const [visibleCount, setVisibleCount] = useState(1);
  const [selectedReply, setSelectedReply] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const heading = useRef(null);
  const conversation = useRef(null);
  const clickLock = useRef(false);
  const audioContext = useRef(null);

  const scene = scenes[current];
  const ending = endings[current];

  // 선택 직후 같은 말을 자동 답변으로 반복하지 않도록 제외합니다.
  const messages = (scene?.messages || []).filter(
    ([speaker, text], index) =>
      !(
        index === 0 &&
        selectedReply &&
        speaker.startsWith('나') &&
        text === selectedReply
      )
  );

  const allMessagesVisible = visibleCount >= messages.length;

  const balance = 4958790;
  const withdrawal = 4900000;

  function prepareAudio() {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    try {
      if (!audioContext.current) {
        audioContext.current = new AudioContextClass();
      }

      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume().catch(() => {});
      }
    } catch {
      // 소리를 사용할 수 없어도 체험은 계속 진행합니다.
    }
  }

  // 전화 화면에서만 벨소리를 재생합니다.
  useEffect(() => {
    if (scene?.kind !== 'call' || !soundEnabled) return;

    const context = audioContext.current;

    if (!context || context.state !== 'running') return;

    const activeTones = new Set();

    function playTone(frequency, start, duration) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.045, start + 0.02);
      gain.gain.setValueAtTime(0.045, start + duration - 0.03);
      gain.gain.linearRampToValueAtTime(0, start + duration);

      oscillator.connect(gain);
      gain.connect(context.destination);

      activeTones.add(oscillator);

      oscillator.onended = () => {
        activeTones.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      };

      oscillator.start(start);
      oscillator.stop(start + duration);
    }

    function ring() {
      const now = context.currentTime;

      playTone(660, now, 0.18);
      playTone(880, now + 0.24, 0.18);
      playTone(660, now + 0.5, 0.18);
      playTone(880, now + 0.74, 0.18);
    }

    ring();

    const interval = window.setInterval(ring, 2300);

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
  }, [current, soundEnabled, scene?.kind]);

  useEffect(() => {
    clickLock.current = false;
    heading.current?.focus();
  }, [current]);

  useEffect(() => {
    const element = conversation.current;

    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [current, visibleCount, selectedReply]);

  useEffect(() => {
    return () => {
      const context = audioContext.current;

      if (context && context.state !== 'closed') {
        context.close().catch(() => {});
      }
    };
  }, []);

  function choose(choice) {
    if (clickLock.current) return;

    clickLock.current = true;

    const [label, nextScene, action, feedback] = choice;
    const next = scenes[nextScene];

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

    // 대화 장면으로 넘어갈 때 선택한 내용을 먼저 보여줍니다.
    const reply =
      label !== '다음' && next?.kind === 'talk'
        ? choiceReplies[label] || label
        : '';

    setSelectedReply(reply);
    setVisibleCount(reply ? 0 : 1);
    setCurrent(nextScene);
  }

  function restart() {
    prepareAudio();
    setHistory([]);
    setSelectedReply('');
    setVisibleCount(1);
    setCurrent(scenario.startScene);
  }

  function exit() {
    setHistory([]);
    setSelectedReply('');
    setVisibleCount(1);
    setCurrent('intro');
  }

  function toggleSound() {
    prepareAudio();
    setSoundEnabled((enabled) => !enabled);
  }

  return (
    <main className="eduPage">
      <div className="eduTop">
        <span>낌새 대화 교육 · 01</span>

        <div className="eduTopRight">
          <span>교육용 가상 체험</span>

          <button
            type="button"
            className="eduSoundToggle"
            aria-pressed={soundEnabled}
            onClick={toggleSound}
          >
            {soundEnabled ? '소리 켜짐' : '소리 꺼짐'}
          </button>
        </div>
      </div>

      {current === 'intro' ? (
        <section className="eduIntro">
          <p className="eduEyebrow">전화 상황 체험</p>

          <h2 tabIndex={-1} ref={heading}>
            {scenario.title}
          </h2>

          <p className="eduLead">
            “누군가 내 등본을 발급받으러 왔다고요?”
            <br />
            이어지는 연락 속에서 어떻게 행동할지 직접 선택해 보세요.
          </p>

          <div className="eduMeta">
            <span>약 3분</span>
            <span>선택에 따라 조기 종료</span>
            <span>마지막에 내 선택 복기</span>
          </div>

          <button
            type="button"
            className="eduPrimary"
            onClick={restart}
          >
            체험 시작하기 →
          </button>

          <p className="eduSmall">
            {soundEnabled && (
              <>
                전화 장면에서 벨소리가 재생됩니다.
                상단에서 소리를 끌 수 있습니다.
                <br />
              </>
            )}
            등장인물과 대사는 교육을 위해 구성했습니다.
            실제 전화나 출금은 발생하지 않습니다.
          </p>
        </section>
      ) : ending ? (
        <section className="eduResult">
          <p className="eduEyebrow">체험 완료 · 내 선택 복기</p>

          <h2 tabIndex={-1} ref={heading}>
            {ending[0]}
          </h2>

          <p className="eduLead">{ending[1]}</p>

          <h3>내가 지나온 선택</h3>

          <ol className="eduReview">
            {history.map((item, index) => (
              <li key={`${item.scene}-${index}`}>
                <span className="eduReviewNumber">
                  {String(index + 1).padStart(2, '0')}
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

            {scenario.lessons.map((lesson, index) => (
              <p key={index}>{lesson}</p>
            ))}
          </section>

          <div className="eduButtons">
            <button
              type="button"
              className="eduPrimary"
              onClick={restart}
            >
              다른 선택으로 다시 해보기
            </button>

            <button type="button" onClick={exit}>
              교육 소개로
            </button>
          </div>
        </section>
      ) : scene ? (
        <>
          <section className="eduStage">
            <div className="eduStageHeading">
              <h2 ref={heading} tabIndex={-1}>
                {scene.title}
              </h2>
            </div>

            {scene.kind === 'call' ? (
              <div className="eduPhone eduPhoneRinging">
                <div className="eduPhoneStatus">
                  수신 전화 · 모의 화면
                </div>

                <div className="eduRingVisual" aria-hidden="true">
                  <span className="eduRingWave" />
                  <span className="eduRingWave eduRingWaveDelayed" />

                  <div className="eduRingingIcon">☎</div>
                </div>

                <p className="eduCaller">{scene.number}</p>
                <p>연락처에 없는 번호</p>

                <div className="eduIncomingStatus">
                  <span />
                  전화가 오고 있습니다
                </div>
              </div>
            ) : scene.kind === 'atm' ? (
              <div className="eduAtm">
                <div className="eduAtmHeader">
                  낌새 모의 ATM
                  <span>현금 인출</span>
                </div>

                <p>인출 정보를 확인해 주세요.</p>

                <dl>
                  <div>
                    <dt>계좌 잔액</dt>
                    <dd>{formatMoney(balance)}</dd>
                  </div>

                  <div>
                    <dt>인출 금액</dt>
                    <dd>{formatMoney(withdrawal)}</dd>
                  </div>

                  <div>
                    <dt>인출 후 잔액</dt>
                    <dd>{formatMoney(balance - withdrawal)}</dd>
                  </div>
                </dl>

                <p className="eduSmall">
                  교육용 화면입니다. 실제 출금은 발생하지 않습니다.
                </p>
              </div>
            ) : (
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
                    key={`${current}-selection`}
                  >
                    <span>
                      {choiceReplies[history[history.length - 1]?.label]
                        ? '나'
                        : '내 선택'}
                    </span>

                    <p>{selectedReply}</p>
                  </div>
                )}

                {messages
                  .slice(0, visibleCount)
                  .map(([speaker, text], index) => (
                    <div
                      className={`eduMessage eduMessageEnter ${
                        speaker.startsWith('나') ? 'isMine' : ''
                      }`}
                      key={`${current}-${index}`}
                    >
                      <span>{speaker}</span>
                      <p>{text}</p>
                    </div>
                  ))}
              </div>
            )}

            <div className="eduDecision">
              {scene.kind === 'talk' && !allMessagesVisible ? (
                <div className="eduDialogueControl">
                  <span>대화를 이어서 확인해 보세요.</span>

                  <button
                    type="button"
                    onClick={() => {
                      setVisibleCount((count) =>
                        Math.min(count + 1, messages.length)
                      );
                    }}
                  >
                    {visibleCount === 0 ? '상대의 답변 보기' : '다음 대사'}
                    {' →'}
                  </button>
                </div>
              ) : (
                <>
                  <p>
                    {scene.choices.length > 1
                      ? '어떻게 하시겠어요?'
                      : '상대의 말을 들었습니다.'}
                  </p>

                  <div className="eduButtons">
                    {scene.choices.map((choice) => (
                      <button
                        type="button"
                        key={choice[0]}
                        onClick={() => choose(choice)}
                      >
                        {choice[0]}
                        {scene.choices.length === 1 ? ' →' : ''}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          <button
            type="button"
            className="eduExit"
            onClick={exit}
          >
            체험 나가기
          </button>
        </>
      ) : null}
    </main>
  );
}