import { useEffect, useRef, useState } from 'react';
import { kkimsaeApi } from './api/kkimsaeApi';
import { getAuthVersion, getTokens } from './api/client';
import './styles.css';
import EducationPage from './EducationPage';
import { PublicationSettings, PublicCaseSearch, AdminPublications } from './PublicationPages';
import IncidentImages from './IncidentImages';
import { exportIncidentReport } from './exportIncidentReport';
/* 공통 설정 */

const pages = [
  ['home', '홈'],
  ['incidents', '내 사건 관리'],
  ['search', '사례 검색'],
  ['education', '대화 교육'],
  ['analysis', 'AI 분석'],
];

const validPages = [
  ...pages.map(([id]) => id),
  'login',
  'signup',
  'account',
  'admin',
];

const heroData = {
  search: ['공개 사례 검색', '비슷한 경험에서 단서를 찾아보세요', '승인된 공개 사례를 검색하고 진행 과정을 살펴보세요.'],
  admin: ['관리자', '공개 사례 검토', '공개 신청 원문과 공개용 내용을 검토하세요.'],
  home: [
    '01 · 홈',
    '기록하고, 연결하고, 예방하세요',
    '겪은 일을 정리하고 비슷한 사례를 찾아보세요.',
  ],
  incidents: [
    '02 · 내 사건 관리',
    '흩어진 기록을 하나의 사건으로',
    '사건의 단서를 모으고 시간순으로 기록하세요.',
  ],
  education: [
    '03 · 대화 교육',
    '대화 속 선택으로 대처 연습',
    '가상 상황을 체험하고 내가 선택한 행동을 돌아보세요.',
  ],
  analysis: [
    '04 · AI 분석',
    '문자·대화 분석',
    '대화와 상황을 입력하고 사기 위험 신호를 살펴보세요.',
  ],
};

const clueLabels = {
  PHONE: '전화번호',
  URL: 'URL',
  ACCOUNT: '계좌번호',
};

function readPage() {
  const page = window.location.hash.slice(1);
  return validPages.includes(page) ? page : 'home';
}

function localId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function blankIncident() {
  return {
    id: null,
    title: '',
    description: '',
    channel: '',
    demand: '',
    company: '',
    clues: [],
  };
}

function toDraft(incident) {
  return {
    id: incident.id,
    title: incident.title || '',
    description: incident.description || '',
    channel: incident.channel || '',
    demand: incident.demand || '',
    company: incident.company || '',
    clues: (incident.clues || []).map((clue) => ({
      ...clue,
      localKey: localId(),
      bankName: clue.bankName || '',
    })),
  };
}

function incidentPayload(draft) {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    channel: draft.channel.trim() || null,
    demand: draft.demand.trim() || null,
    company: draft.company.trim() || null,
    clues: draft.clues.map((clue) => ({
      type: clue.type,
      value: clue.value.trim(),
      bankName:
        clue.type === 'ACCOUNT'
          ? clue.bankName.trim()
          : null,
    })),
  };
}

function formatDate(value) {
  return value ? value.replace('T', ' ').slice(0, 16) : '—';
}

function sortEvents(events = []) {
  return [...events].sort(
    (a, b) =>
      a.occurredAt.localeCompare(b.occurredAt) ||
      Number(a.id || 0) - Number(b.id || 0)
  );
}

/* 기존 로고 및 배너 */

function Logo() {
  return (
    <div className="logo" aria-label="낌새">
      <img
        src="/images/kkimsae-logo.png"
        alt=""
        className="logoImage"
      />
      <span>낌새</span>
    </div>
  );
}
function Hero({ page }) {
  const data = heroData[page];

  if (!data) return null;

  return (
    <section className={`hero hero-${page}`}>
      <div className="heroInner">
        <h1>{data[1]}</h1>
        <p>{data[2]}</p>
      </div>
    </section>
  );
}

/* 회원가입 및 로그인 */

function Account({
  mode,
  user,
  onNavigate,
  onLogin,
  onLogout,
  onNotice,
}) {
  const signup = mode === 'signup';

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();

    if (busy) return;

    setError('');

    if (signup && nickname.trim().length < 2) {
      setError('닉네임은 2자 이상 입력해주세요.');
      return;
    }

    if (signup && password.length < 8) {
      setError('비밀번호는 8자 이상 입력해주세요.');
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError('비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.');
      return;
    }

    if (signup && password !== confirmation) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setBusy(true);

    try {
      const address = email.trim().toLowerCase();

      if (signup) {
        await kkimsaeApi.signup({
          email: address,
          password,
          nickname: nickname.trim(),
        });

        onNavigate('login');
        onNotice('회원가입이 완료되었습니다. 로그인해주세요.');
      } else {
        await kkimsaeApi.login({
          email: address,
          password,
        });

        const version = getAuthVersion();
        const member = await kkimsaeApi.me();

        if (version === getAuthVersion()) {
          onLogin(member);
        }
      }
    } catch (err) {
      setError(err.message || '요청을 처리하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authPanel">
        {user ? (
          <>
            <p className="eyebrow">MY ACCOUNT</p>
            <h1>{user.nickname}님, 안녕하세요.</h1>
            <p>{user.email}</p>

            <div className="actions">
              <button
                className="primary"
                onClick={() => onNavigate('incidents')}
              >
                내 사건 관리
              </button>
              <button onClick={onLogout}>로그아웃</button>
            </div>
          </>
        ) : (
          <>
            <h1>{signup ? '회원가입' : '로그인'}</h1>
            <p>
              {signup
                ? '기록을 이어갈 계정을 만들어보세요.'
                : '내 사건을 이어서 정리해보세요.'}
            </p>

            <form onSubmit={submit}>
              <fieldset className="plainFieldset" disabled={busy}>
                {signup && (
                  <label>
                    닉네임
                    <input
                      required
                      minLength={2}
                      maxLength={20}
                      autoComplete="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </label>
                )}

                <label>
                  이메일
                  <input
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                  />
                </label>

                <label>
                  비밀번호
                  <div className="passwordField">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={signup ? 8 : undefined}
                      maxLength={72}
                      autoComplete={
                        signup ? 'new-password' : 'current-password'
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? '숨기기' : '보기'}
                    </button>
                  </div>
                </label>

                {signup && (
                  <label>
                    비밀번호 확인
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                    />
                  </label>
                )}

                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}

                <button className="primary wide">
                  {busy ? '처리 중…' : signup ? '회원가입' : '로그인'}
                </button>
              </fieldset>
            </form>

            <p className="authSwitch">
              {signup ? '이미 계정이 있나요?' : '처음 이용하시나요?'}
              <button
                className="link"
                disabled={busy}
                onClick={() => onNavigate(signup ? 'login' : 'signup')}
              >
                {signup ? '로그인' : '회원가입'}
              </button>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

/* 사건 상세 조회 */

function IncidentDetail({
  incident,
  eventCount,
  disabled,
  onEdit,
  onDelete,
  onCopy,
  children,
}) {
  const clues = incident.clues || [];

  return (
    <article className="caseReadable">
      <div className="caseReadableTitle">
<p className="caseReadableStatus">
  내 사건 · 원본은 나만 볼 수 있어요
</p>
        <h2>{incident.title}</h2>

        <div className="caseReadableActions">
          <button
            type="button"
            className="primary"
            disabled={disabled}
            onClick={onEdit}
          >
            사건 수정
          </button>
          <button
            type="button"
            className="danger"
            disabled={disabled}
            onClick={onDelete}
          >
            삭제
          </button>
        </div>

        <div className="caseReadableDates">
          <span>
            <span>작성</span>
            <time>{formatDate(incident.createdAt)}</time>
          </span>
          <span>
            <span>수정</span>
            <time>{formatDate(incident.updatedAt)}</time>
          </span>
        </div>
      </div>

      <section className="caseReadableSection">
        <h3>사건 설명</h3>
        <p className="caseReadableDescription">
          {incident.description}
        </p>
      </section>

      <section className="caseReadableSection">
        <h3>사건 기본 정보</h3>

        <div className="caseInfoTableWrap">
          <table className="caseInfoTable">
            <tbody>
              <tr>
                <th scope="row">접근 경로</th>
                <td>{incident.channel || '정보 없음'}</td>
              </tr>
              <tr>
                <th scope="row">요구 명목</th>
                <td>{incident.demand || '정보 없음'}</td>
              </tr>
              <tr>
                <th scope="row">상대가 사용한 업체명</th>
                <td>{incident.company || '정보 없음'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="caseReadableSection">
        <div className="caseReadableSectionHeading">
          <h3>사건 단서</h3>
          <span>{clues.length}개</span>
        </div>

        <div className="caseClueTableWrap">
          <table className="caseEvidenceTable">
            <thead>
              <tr>
                <th scope="col">종류</th>
                <th scope="col">단서 정보</th>
                <th scope="col">복사</th>
              </tr>
            </thead>
            <tbody>
              {clues.length ? (
                clues.map((clue, index) => (
                  <tr key={clue.id ?? index}>
                    <td>{clueLabels[clue.type] || clue.type}</td>
                    <td>
                      <div className="caseEvidenceValue">
                        {clue.type === 'ACCOUNT' && clue.bankName && (
                          <span className="caseEvidenceBank">
                            {clue.bankName}
                          </span>
                        )}
                        <span>{clue.value}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="caseEvidenceCopy"
                        onClick={() =>
                          onCopy(
                            clue.type === 'ACCOUNT'
                              ? `${clue.bankName || ''} ${clue.value}`.trim()
                              : clue.value
                          )
                        }
                      >
                        복사
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>등록된 단서가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="caseReadableFootnote">
          등록된 단서 {clues.length}개 · 타임라인 {eventCount}개
        </p>
      </section>

      {children}
    </article>
  );
}

/* 사건 정보 및 단서 편집 */

function IncidentForm({
  draft,
  busy,
  onChange,
  onSubmit,
  onCancel,
}) {
  function changeClue(localKey, key, value) {
    onChange(
      'clues',
      draft.clues.map((clue) => {
        if (clue.localKey !== localKey) return clue;

        return {
          ...clue,
          [key]: value,
          ...(key === 'type' && value !== 'ACCOUNT'
            ? { bankName: '' }
            : {}),
        };
      })
    );
  }

  function addClue() {
    onChange('clues', [
      ...draft.clues,
      {
        localKey: localId(),
        type: 'PHONE',
        value: '',
        bankName: '',
      },
    ]);
  }

  return (
    <>
      <div className="heading">
        <h2>{draft.id ? '사건 수정' : '새 사건 작성'}</h2>
        <span className="badge">비공개 사건</span>
      </div>

      <form onSubmit={onSubmit}>
        <fieldset className="plainFieldset" disabled={busy}>
          <label>
            제목 *
            <input
              required
              maxLength={150}
              value={draft.title}
              onChange={(e) => onChange('title', e.target.value)}
            />
          </label>

          <label>
            사건 설명 *
            <textarea
              required
              rows={5}
              maxLength={10000}
              value={draft.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="어떻게 연락받았고 어떤 일을 겪었는지 작성해주세요."
            />
          </label>

          <div className="formGrid">
            <label>
              접근 경로
              <input
                maxLength={100}
                value={draft.channel}
                onChange={(e) => onChange('channel', e.target.value)}
                placeholder="예: 인스타그램"
              />
            </label>

            <label>
              요구 명목
              <input
                maxLength={200}
                value={draft.demand}
                onChange={(e) => onChange('demand', e.target.value)}
                placeholder="예: 출금 수수료"
              />
            </label>

            <label>
              상대가 사용한 업체명
              <input
                maxLength={200}
                value={draft.company}
                onChange={(e) => onChange('company', e.target.value)}
              />
            </label>
          </div>

          <section className="section">
            <div className="heading">
              <div>
                <h3>사건 단서</h3>
                <p>알고 있는 단서를 여러 개 등록할 수 있어요.</p>
              </div>
              <span className="badge">{draft.clues.length}/30</span>
            </div>

            {draft.clues.map((clue) => (
              <div className="clueEditor" key={clue.localKey}>
                <label>
                  종류
                  <select
                    value={clue.type}
                    onChange={(e) =>
                      changeClue(clue.localKey, 'type', e.target.value)
                    }
                  >
                    {Object.entries(clueLabels).map(([type, label]) => (
                      <option key={type} value={type}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  단서 값 *
                  <input
                    required
                    maxLength={2048}
                    type={
                      clue.type === 'URL'
                        ? 'url'
                        : clue.type === 'PHONE'
                          ? 'tel'
                          : 'text'
                    }
                    value={clue.value}
                    onChange={(e) =>
                      changeClue(clue.localKey, 'value', e.target.value)
                    }
                    placeholder={
                      clue.type === 'URL'
                        ? 'https://example.com'
                        : clue.type === 'PHONE'
                          ? '010-1234-5678'
                          : '계좌번호'
                    }
                  />
                </label>

                {clue.type === 'ACCOUNT' && (
                  <label>
                    은행명 *
                    <input
                      required
                      maxLength={100}
                      value={clue.bankName}
                      onChange={(e) =>
                        changeClue(clue.localKey, 'bankName', e.target.value)
                      }
                    />
                  </label>
                )}

                <button
                  type="button"
                  className="danger"
                  onClick={() =>
                    onChange(
                      'clues',
                      draft.clues.filter(
                        (item) => item.localKey !== clue.localKey
                      )
                    )
                  }
                >
                  단서 제거
                </button>
              </div>
            ))}

            <button
              type="button"
              disabled={draft.clues.length >= 30}
              onClick={addClue}
            >
              + 단서 추가
            </button>
          </section>

          <div className="actions section">
            <button className="primary">
              {busy
                ? '저장 중…'
                : draft.id
                  ? '사건 정보·단서 저장'
                  : '사건 저장 후 타임라인 작성'}
            </button>

            <button type="button" onClick={onCancel}>
              {draft.id ? '수정 화면 닫기' : '작성 취소'}
            </button>
          </div>
        </fieldset>
      </form>
    </>
  );
}

/* 타임라인 한 개의 편집 폼 */

function TimelineEditor({
  event,
  busy,
  onSave,
  onDelete,
  onCancel,
}) {
  const [occurredAt, setOccurredAt] = useState(
    event?.occurredAt || ''
  );
  const [content, setContent] = useState(event?.content || '');
  const [tag, setTag] = useState(event?.tag || '');

  // 저장된 해당 기록이 바뀌었을 때만 입력값을 갱신합니다.
  useEffect(() => {
    setOccurredAt(event?.occurredAt || '');
    setContent(event?.content || '');
    setTag(event?.tag || '');
  }, [event]);

  function reset() {
    setOccurredAt(event?.occurredAt || '');
    setContent(event?.content || '');
    setTag(event?.tag || '');
  }

  function submit(e) {
    e.preventDefault();

    if (busy) return;

    onSave(event?.id, {
      occurredAt:
        occurredAt.length === 16
          ? `${occurredAt}:00`
          : occurredAt,
      content: content.trim(),
      tag: tag.trim() || null,
    });
  }

  return (
    <form className="timelineEntry" onSubmit={submit}>
      <fieldset className="plainFieldset" disabled={busy}>
        <h4>{event ? '기록 수정' : '새 기록'}</h4>

        <label>
          발생 날짜·시간 *
          <input
            type="datetime-local"
            step="1"
            required
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </label>

        <label>
          기록 내용 *
          <textarea
            required
            rows={3}
            maxLength={10000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>

        <label>
          단계 요약
          <input
            maxLength={100}
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="예: 출금 조건으로 추가 입금 요구"
          />
        </label>

        <div className="actions">
          <button className="primary">
            {busy ? '처리 중…' : '기록 저장'}
          </button>

          {event ? (
            <>
              <button type="button" onClick={reset}>
                입력 되돌리기
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => onDelete(event.id)}
              >
                기록 삭제
              </button>
            </>
          ) : (
            <button type="button" onClick={onCancel}>
              추가 취소
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}

/* 타임라인 조회 및 편집 */

function TimelineSection({
  incidentId,
  events,
  busy,
  editable = false,
  editingId,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}) {
  return (
    <section className="caseReadableSection caseTimelineSection">
      <div className="caseReadableSectionHeading">
        <h3>타임라인</h3>
        <span>{events.length}개 기록</span>
      </div>

      <p className="hint">
        {editable
          ? '날짜·내용·단계 요약을 수정하고 각 기록의 저장 버튼을 눌러주세요.'
          : '실제 발생 일시순으로 정리한 기록입니다. 사건 수정을 누르면 함께 수정할 수 있어요.'}
      </p>

      <div className="caseTimelineCards">
        {sortEvents(events).map((event, index) =>
          editable ? (
            <div
              className="caseTimelineEditCard"
              key={event.id}
            >
              <TimelineEditor
                event={event}
                busy={busy}
                onSave={onSave}
                onDelete={onDelete}
              />
            </div>
          ) : (
            <article
              className="caseTimelineCard"
              key={event.id}
            >
              <div className="caseTimelineCardTop">
                <div className="caseTimelineTime">
                  <span className="caseTimelineNumber">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <time>{formatDate(event.occurredAt)}</time>
                </div>
              </div>

              <p className="caseTimelineContent">
                {event.content}
              </p>

              <div className="caseTimelineTagLine">
                <span className="caseTimelineTagLabel">
                  단계 요약
                </span>
                {event.tag ? (
                  <span className="caseTimelineTag">
                    {event.tag}
                  </span>
                ) : (
                  <span className="caseTimelineNoTag">
                    작성하지 않음
                  </span>
                )}
              </div>
            </article>
          )
        )}
      </div>

      {!events.length && (
        <div className="empty">
          아직 작성한 타임라인이 없습니다.
        </div>
      )}

      {editable &&
        (editingId === 'new' ? (
          <div className="caseTimelineEditCard">
            <TimelineEditor
              key={`new-${incidentId}`}
              busy={busy}
              onSave={onSave}
              onCancel={onCancel}
            />
          </div>
        ) : (
          <button
            type="button"
            className="caseTimelineAddButton"
            disabled={busy}
            onClick={() => onEdit('new')}
          >
            + 타임라인 기록 추가
          </button>
        ))}
    </section>
  );
}

/* AI 분석 */

function Analysis() {
  const [text, setText] = useState('');
  const [situation, setSituation] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();

    if (loading || !text.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await kkimsaeApi.analyze({
        text: text.trim(),
        situation: situation.trim(),
      });

      if (
        typeof data?.judgment !== 'string' ||
        typeof data?.reason !== 'string' ||
        typeof data?.emergency !== 'boolean'
      ) {
        throw new Error('분석 결과의 응답 형식을 확인해주세요.');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

    return (
    <main className="analysisPage">
      <form className="analysisForm" onSubmit={submit}>
        <div className="analysisFormHeading">
          <h2>어떤 대화가 의심되나요?</h2>
          <p>
            받은 내용을 그대로 붙여넣고,
            당시 상황도 함께 알려주세요.
          </p>
        </div>

        <fieldset
          className="plainFieldset"
          disabled={loading}
        >
          <label>
            문자·대화 내용
            <textarea
              required
              rows={7}
              maxLength={10000}
              placeholder="의심되는 문자나 대화 내용을 입력해주세요."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>

          <label>
            상황 설명
            <span className="analysisOptional">선택</span>

            <textarea
              rows={3}
              maxLength={5000}
              placeholder="예: 카드를 신청한 적이 없는데 배송 안내를 받았어요."
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
            />
          </label>

          <div className="analysisFormFooter">
            <span>이름·연락처 등 개인정보는 지워주세요.</span>

            <button
              type="submit"
              className="primary"
              disabled={loading || !text.trim()}
            >
              {loading ? '분석 중…' : '위험 신호 분석하기'}
            </button>
          </div>
        </fieldset>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>

      {loading && (
        <p className="analysisLoading" role="status">
          입력한 대화와 상황을 살펴보고 있어요.
        </p>
      )}

      {result && (
        <section
          className={`analysisResult ${
            result.emergency ||
            result.judgment === '사기 의심'
              ? 'isRisk'
              : result.judgment === '뚜렷한 위험 신호 없음'
                ? 'isClear'
                : 'isUncertain'
          }`}
          aria-live="polite"
        >
          <div className="analysisResultHeading">
            <span className="analysisResultIcon" aria-hidden="true">
              {result.emergency ||
              result.judgment === '사기 의심'
                ? '!'
                : '?'}
            </span>

            <div>
              <span className="analysisResultLabel">
                분석 결과
              </span>
              <h2>{result.judgment}</h2>
            </div>
          </div>

          <div className="analysisReason">
            <h3>판정 근거</h3>
            <p>{result.reason}</p>
          </div>

          {result.emergency && (
            <p className="analysisEmergency">
              신체적 위협 표현이 감지되었습니다.
            </p>
          )}

          <p className="analysisDisclaimer">
            분석 결과는 참고용이며 안전을 보장하지 않습니다.
          </p>
        </section>
      )}
    </main>
  );
}
/* 전체 앱 */

export default function App() {

const reportContentRef = useRef(null);
const [reportExporting, setReportExporting] = useState(false);

async function saveIncidentReport() {
  if (!savedIncident || reportExporting) return;

  setReportExporting(true);

  try {
    await exportIncidentReport({
      content: reportContentRef.current,
      title: savedIncident.title,
    });
  } catch (err) {
    setNotice(
      err.message || '사건 정리본을 만들지 못했습니다.'
    );
  } finally {
    setReportExporting(false);
  }
}


  const [page, setPage] = useState(readPage);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [draft, setDraft] = useState(null);
  const [savedIncident, setSavedIncident] = useState(null);
  const [events, setEvents] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const detailRequestId = useRef(0);

  function resetIncident() {
    detailRequestId.current += 1;
    setDraft(null);
    setSavedIncident(null);
    setEvents([]);
    setIsEditing(false);
    setEditingEventId(null);
    setDetailLoading(false);
    setBusy(false);
    setError('');
  }

  function navigate(nextPage) {
    window.location.hash = nextPage;
    setPage(nextPage);
    setNotice('');
    setError('');
    window.scrollTo({ top: 0 });
  }

  useEffect(() => {
    const onHashChange = () => setPage(readPage());

    const onExpired = () => {
      setUser(null);
      setItems([]);
      resetIncident();
      setAuthLoading(false);
      window.location.hash = 'login';
      setPage('login');
      setNotice('로그인 상태가 만료되었습니다. 다시 로그인해주세요.');
    };

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('kkimsae:auth-expired', onExpired);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('kkimsae:auth-expired', onExpired);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const version = getAuthVersion();

    async function restoreLogin() {
      const tokens = getTokens();

      if (!tokens?.accessToken && !tokens?.refreshToken) {
        setAuthLoading(false);
        return;
      }

      try {
        const member = await kkimsaeApi.me();

        if (!cancelled && version === getAuthVersion()) {
          setUser(member);
        }
      } catch (err) {
        if (!cancelled && version === getAuthVersion()) {
          setNotice(err.message);
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    restoreLogin();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshList() {
    const version = getAuthVersion();
    const data = await kkimsaeApi.getIncidents();
    const list = Array.isArray(data) ? data : data?.content;

    if (!Array.isArray(list)) {
      throw new Error('사건 목록 응답 형식을 확인해주세요.');
    }

    if (version === getAuthVersion()) {
      setItems(list);
    }
  }

  useEffect(() => {
    if (!user) {
      setItems([]);
      setListLoading(false);
      return;
    }

    let cancelled = false;
    const version = getAuthVersion();

    setListLoading(true);
    setListError('');

    kkimsaeApi
      .getIncidents()
      .then((data) => {
        if (cancelled || version !== getAuthVersion()) return;

        const list = Array.isArray(data) ? data : data?.content;

        if (!Array.isArray(list)) {
          throw new Error('사건 목록 응답 형식을 확인해주세요.');
        }

        setItems(list);
      })
      .catch((err) => {
        if (!cancelled && version === getAuthVersion()) {
          setListError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  function signedIn(member) {
    resetIncident();
    setItems([]);
    setUser(member);
    navigate('incidents');
    setNotice('로그인했습니다.');
  }

  async function logout() {
    setUser(null);
    setItems([]);
    resetIncident();
    navigate('home');

    try {
      await kkimsaeApi.logout();
      setNotice('로그아웃했습니다.');
    } catch {
      setNotice(
        '이 브라우저에서는 로그아웃했습니다. 서버의 토큰 폐기 요청은 실패했습니다.'
      );
    }
  }

  function newIncident() {
    if (!user) {
      navigate('login');
      return;
    }

    resetIncident();
    setDraft(blankIncident());
    setIsEditing(true);
    navigate('incidents');
  }

  async function openIncident(id) {
    if (busy) return;

    const requestId = ++detailRequestId.current;
    const version = getAuthVersion();

    navigate('incidents');
    setDetailLoading(true);
    setDraft(null);
    setSavedIncident(null);
    setEvents([]);
    setIsEditing(false);
    setEditingEventId(null);

    try {
      const [incident, timeline] = await Promise.all([
        kkimsaeApi.getIncident(id),
        kkimsaeApi.getTimeline(id),
      ]);

      if (
        requestId !== detailRequestId.current ||
        version !== getAuthVersion()
      ) {
        return;
      }

      setDraft(toDraft(incident));
      setSavedIncident(incident);
      setEvents(sortEvents(timeline));
    } catch (err) {
      if (
        requestId === detailRequestId.current &&
        version === getAuthVersion()
      ) {
        setError(err.message);
      }
    } finally {
      if (
        requestId === detailRequestId.current &&
        version === getAuthVersion()
      ) {
        setDetailLoading(false);
      }
    }
  }

  function updateDraft(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function startEditing() {
    if (!savedIncident || busy) return;

    setDraft(toDraft(savedIncident));
    setIsEditing(true);
    setEditingEventId(null);
    setError('');
    setNotice('');
  }

  function cancelEditing() {
    if (busy) return;

    if (savedIncident) {
      setDraft(toDraft(savedIncident));
    } else {
      setDraft(null);
    }

    setIsEditing(false);
    setEditingEventId(null);
    setError('');
  }

  async function saveIncident(event) {
    event.preventDefault();

    if (busy || !draft) return;

    if (!draft.title.trim() || !draft.description.trim()) {
      setError('제목과 사건 설명을 입력해주세요.');
      return;
    }

    if (
      draft.clues.some(
        (clue) =>
          !clue.value.trim() ||
          (clue.type === 'ACCOUNT' && !clue.bankName.trim())
      )
    ) {
      setError('단서 값을 입력하고 계좌번호에는 은행명도 입력해주세요.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    const version = getAuthVersion();

    try {
      const payload = incidentPayload(draft);
      const saved = draft.id
        ? await kkimsaeApi.updateIncident(draft.id, payload)
        : await kkimsaeApi.createIncident(payload);

      if (version !== getAuthVersion()) return;

      setDraft(toDraft(saved));
      setSavedIncident(saved);

      // 저장 후에도 수정 화면을 유지하여 타임라인을 이어서 편집합니다.
      setIsEditing(true);
      setNotice('사건 정보와 단서를 저장했습니다.');

      try {
        await refreshList();
      } catch {
        if (version === getAuthVersion()) {
          setNotice(
            '사건은 저장됐지만 목록 갱신에 실패했습니다. 목록 새로고침을 눌러주세요.'
          );
        }
      }
    } catch (err) {
      if (version === getAuthVersion()) {
        setError(err.message);
      }
    } finally {
      if (version === getAuthVersion()) {
        setBusy(false);
      }
    }
  }

  async function deleteIncident() {
    if (!savedIncident || busy) return;

    if (
      !window.confirm('사건과 연결된 단서·타임라인을 모두 삭제할까요?')
    ) {
      return;
    }

    setBusy(true);
    setError('');

    const version = getAuthVersion();

    try {
      await kkimsaeApi.deleteIncident(savedIncident.id);

      if (version !== getAuthVersion()) return;

      resetIncident();
      setNotice('사건을 삭제했습니다.');

      try {
        await refreshList();
      } catch {
        if (version === getAuthVersion()) {
          setNotice('삭제는 완료됐지만 목록 갱신에 실패했습니다.');
        }
      }
    } catch (err) {
      if (version === getAuthVersion()) {
        setError(err.message);
      }
    } finally {
      if (version === getAuthVersion()) {
        setBusy(false);
      }
    }
  }

  async function saveTimelineEvent(eventId, payload) {
    if (!savedIncident || busy) return;

    if (!payload.content || !payload.occurredAt) {
      setError('발생 일시와 기록 내용을 입력해주세요.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    const version = getAuthVersion();
    const incidentId = savedIncident.id;

    try {
      const saved = eventId
        ? await kkimsaeApi.updateTimelineEvent(
            incidentId,
            eventId,
            payload
          )
        : await kkimsaeApi.createTimelineEvent(incidentId, payload);

      if (version !== getAuthVersion()) return;

      setEvents((current) =>
        sortEvents([
          ...current.filter((item) => item.id !== saved.id),
          saved,
        ])
      );

      // 기존 기록을 저장할 때 작성 중인 새 기록은 닫지 않습니다.
      if (!eventId) {
        setEditingEventId(null);
      }

      setNotice(
        eventId
          ? '타임라인 기록을 수정했습니다.'
          : '타임라인 기록을 추가했습니다.'
      );
    } catch (err) {
      if (version === getAuthVersion()) {
        setError(err.message);
      }
    } finally {
      if (version === getAuthVersion()) {
        setBusy(false);
      }
    }
  }

  async function deleteTimelineEvent(eventId) {
    if (!savedIncident || busy) return;
    if (!window.confirm('이 기록을 삭제할까요?')) return;

    setBusy(true);
    setError('');

    const version = getAuthVersion();

    try {
      await kkimsaeApi.deleteTimelineEvent(
        savedIncident.id,
        eventId
      );

      if (version !== getAuthVersion()) return;

      setEvents((current) =>
        current.filter((item) => item.id !== eventId)
      );

      setNotice('타임라인 기록을 삭제했습니다.');
    } catch (err) {
      if (version === getAuthVersion()) {
        setError(err.message);
      }
    } finally {
      if (version === getAuthVersion()) {
        setBusy(false);
      }
    }
  }

  async function copyClue(text) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('단서를 복사했습니다.');
    } catch {
      setNotice('자동 복사에 실패했습니다. 값을 선택해서 복사해주세요.');
    }
  }

  async function reloadList() {
    setListLoading(true);
    setListError('');

    const version = getAuthVersion();

    try {
      await refreshList();
    } catch (err) {
      if (version === getAuthVersion()) {
        setListError(err.message);
      }
    } finally {
      if (version === getAuthVersion()) {
        setListLoading(false);
      }
    }
  }

  const recentItems = [...items]
    .sort((a, b) =>
      (b.updatedAt || '').localeCompare(a.updatedAt || '')
    )
    .slice(0, 3);

  return (
    <>
      <header className="topbar">
        <div className="headerInner">
          <button
            className="logoButton"
            aria-label="낌새 홈으로 이동"
            onClick={() => navigate('home')}
          >
            <Logo />
          </button>

          <nav aria-label="주 메뉴">
            {pages.map(([id, label]) => (
              <button
                key={id}
                className={page === id ? 'active' : ''}
                onClick={() => navigate(id)}
              >
                {label}
              </button>
            ))}
            {user && <button className={page === 'admin' ? 'active' : ''} onClick={() => navigate('admin')}>관리자</button>}
          </nav>

          <div className="authHeader">
            {authLoading ? (
              <span className="hint">로그인 확인 중…</span>
            ) : user ? (
              <>
                <button
                  className="loginButton"
                  onClick={() => navigate('account')}
                >
                  {user.nickname}님
                </button>
                <button className="textButton" onClick={logout}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('login')}>
                  로그인
                </button>
                <button
                  className="primary"
                  onClick={() => navigate('signup')}
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <Hero page={page} />

      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button
            aria-label="알림 닫기"
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </div>
      )}

{/* 홈 */}
{page === 'home' && (
  <main className="landingHome">
    <section className="landingStart">
      <h2>
        의심되는 순간부터,
        <br />
        다음 선택까지.
      </h2>

      <div>
        <p>
          겪은 일을 기록하고, 비슷한 사례를 살펴보고,
          <br />
          다시 마주할 상황을 연습하세요.
        </p>

        <div className="actions">
          <button
            className="primary"
            disabled={authLoading || busy}
            onClick={newIncident}
          >
            사건 기록하기 ↗
          </button>

          <button
            className="landingText"
            onClick={() => navigate('search')}
          >
            사례 찾아보기 →
          </button>
        </div>
      </div>
    </section>

    <section className="landingRecent">
      <div className="heading">
        <h2>최근 기록</h2>

        <button
          className="landingText"
          onClick={() => navigate('incidents')}
        >
          전체 보기 →
        </button>
      </div>

      {authLoading || listLoading ? (
        <div className="empty">불러오는 중…</div>
      ) : !user ? (
        <div className="empty">
          로그인하고 사건 기록을 관리해보세요.

          <button onClick={() => navigate('login')}>
            로그인
          </button>
        </div>
      ) : listError ? (
        <div className="empty">
          <p className="error">{listError}</p>

          <button onClick={reloadList}>
            다시 불러오기
          </button>
        </div>
      ) : recentItems.length ? (
        recentItems.map((incident) => (
          <button
            className="listRow"
            key={incident.id}
            disabled={busy}
            onClick={() => openIncident(incident.id)}
          >
            <span>
              <strong>{incident.title}</strong>

              <small>
                수정 {formatDate(incident.updatedAt)}
              </small>
            </span>

            <span>상세 보기 →</span>
          </button>
        ))
      ) : (
        <div className="empty">
          아직 기록한 사건이 없어요.

          <button onClick={newIncident}>
            첫 사건 기록하기
          </button>
        </div>
      )}
    </section>

    <section className="landingFeature">
      <div className="landingFeatureCopy">
        <h2>
          흩어진 기록을
          <br />
          하나의 흐름으로.
        </h2>

        <p>
          대화, 전화번호, 입금 내역.
          <br />
          따로 남아 있던 단서와 증거를 모으고
          <br />
          시간순으로 사건을 정리하세요.
        </p>

        <button
          className="landingText"
          disabled={authLoading || busy}
          onClick={newIncident}
        >
          내 사건 기록하기 →
        </button>
      </div>

      <div
        className="landingTimeline"
        aria-label="사건 기록 구성 예시"
      >
        <div className="landingDemoTitle">
          사건 타임라인
          <span>기록 예시</span>
        </div>

        <ol>
          <li>
            <span>첫 연락</span>
            <strong>메신저로 아르바이트 제안</strong>
            <p>상대방이 보낸 대화 캡처 보관</p>
          </li>

          <li>
            <span>입금 요구</span>
            <strong>업무 시작 전 보증금 요청</strong>
            <p>전달받은 계좌번호 기록</p>
          </li>

          <li>
            <span>추가 연락</span>
            <strong>출금을 위한 추가 송금 요구</strong>
            <p>연락 내용과 입금 내역 정리</p>
          </li>
        </ol>
      </div>
    </section>

    <section className="landingSearch">
      <div>
        <h2>
          나와 비슷한 일,
          <br />
          다른 기록에서 찾기.
        </h2>

        <p>
          공개된 사례에서 상대의 접근 방식과 요구를 살펴보세요.
          <br />
          내가 겪은 상황을 이해하는 단서가 될 수 있어요.
        </p>

        <button
          className="primary"
          onClick={() => navigate('search')}
        >
          공개 사례 검색 →
        </button>
      </div>

      <img
        src="/images/case-search.png"
        alt=""
        loading="lazy"
      />
    </section>

    <section className="landingEducation">
      <div>
        <h2>
          알고 있어도,
          <br />
          막상 겪으면 다르니까.
        </h2>

        <p>
          기관 사칭부터 링크를 이용한 접근까지.
          <br />
          가상 대화에서 직접 선택하고 대처 방법을 익혀보세요.
        </p>

        <button onClick={() => navigate('education')}>
          대화 교육 시작하기 →
        </button>
      </div>

      <div
        className="landingConversation"
        aria-label="대화 교육 예시"
      >
        <span className="landingDemoLabel">
          가상 상황 예시
        </span>

        <p className="landingBubble">
          본인 명의 계좌가 사건에 연루됐습니다.
          <br />
          지금 안내하는 계좌로 돈을 보내세요.
        </p>

        <p className="landingReply">
          통화를 끊고 공식 번호로 확인할게요.
        </p>

        <div className="landingFeedback">
          상대가 알려준 번호 대신,
          <br />
          직접 확인한 공식 연락처를 이용하세요.
        </div>
      </div>
    </section>
<section className="landingAnalysis">
  <div>
    <h2>
      이 대화,
      <br />
      의심해봐야 할까요?
    </h2>

    <p>
      받은 문자나 대화 내용을 상황과 함께 입력하세요.
      <br />
      AI가 위험 신호를 분석하고 판단 근거를 알려드려요.
    </p>

    <button
      className="primary"
      onClick={() => navigate('analysis')}
    >
      대화 분석하기 →
    </button>
  </div>

  <div className="landingAnalysisDemo">
    <span className="landingDemoLabel">
      분석 예시
    </span>

    <p className="landingAnalysisMessage">
      수익금을 출금하려면
      <br />
      보증금을 먼저 입금하셔야 합니다.
    </p>

    <div className="landingAnalysisResult">
      <span className="landingAnalysisStatus">
        사기 의심
      </span>

      <h3>출금 전에 돈을 요구하고 있어요.</h3>

      <p>
        수익금을 받기 위해 먼저 입금하라는 요구는
        주의해서 확인해야 할 위험 신호예요.
      </p>
    </div>

    <small>
      이해를 돕기 위한 예시이며, 실제 분석 결과는
      입력 내용에 따라 달라집니다.
    </small>
  </div>
</section>


  </main>
)}

      {/* 사건 관리 로그인 확인 */}
      {page === 'incidents' && authLoading && (
        <main>
          <div className="empty">
            로그인 상태를 확인하고 있어요.
          </div>
        </main>
      )}

      {/* 사건 관리 */}
      {page === 'incidents' && !authLoading && user && (
        <main className="incidentPage">
          <div className="workspace">
            <aside>
              <button
                className="primary wide"
                disabled={busy}
                onClick={newIncident}
              >
                + 새 사건
              </button>

              <button
                className="wide listRefresh"
                disabled={busy || listLoading}
                onClick={reloadList}
              >
                목록 새로고침
              </button>

              {listLoading && (
                <p className="hint">목록 불러오는 중…</p>
              )}

              {listError && (
                <p className="error">{listError}</p>
              )}

              {items.map((incident) => (
                <button
                  key={incident.id}
                  className={`caseNav ${
                    savedIncident?.id === incident.id
                      ? 'selected'
                      : ''
                  }`}
                  disabled={busy}
                  onClick={() => openIncident(incident.id)}
                >
                  <strong>{incident.title}</strong>
                  <small>
                    {formatDate(incident.updatedAt)}
                  </small>
                </button>
              ))}
            </aside>

            <section>
              {error && (
                <p className="error requestError" role="alert">
                  {error}
                </p>
              )}

              {detailLoading ? (
                <div className="empty">
                  사건과 타임라인을 불러오는 중…
                </div>
              ) : isEditing && draft ? (
                /* 수정 화면: 사건 폼과 타임라인 폼을 함께 표시 */
                <article className="caseReadable">
                  <p className="hint">
                    사건 정보·단서와 각 타임라인 기록은 각각
                    저장됩니다. 저장하지 않은 입력은 수정 화면을
                    닫으면 사라집니다.
                  </p>

                  <IncidentForm
                    draft={draft}
                    busy={busy}
                    onChange={updateDraft}
                    onSubmit={saveIncident}
                    onCancel={cancelEditing}
                  />

                  {savedIncident ? (
                    <TimelineSection
                      incidentId={savedIncident.id}
                      events={events}
                      busy={busy}
                      editable
                      editingId={editingEventId}
                      onEdit={(id) => {
                        setEditingEventId(id);
                        setError('');
                      }}
                      onCancel={() => {
                        setEditingEventId(null);
                        setError('');
                      }}
                      onSave={saveTimelineEvent}
                      onDelete={deleteTimelineEvent}
                    />
                  ) : (
                    <section className="caseReadableSection caseTimelineSection">
                      <h3>타임라인</h3>
                      <p className="hint">
                        먼저 사건을 저장하면 이곳에서 기록을
                        추가할 수 있어요.
                      </p>
                    </section>
                  )}

                  {savedIncident && (
                    <div className="actions section">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={cancelEditing}
                      >
                        조회 화면으로 돌아가기
                      </button>
                    </div>
                  )}
                </article>
              ) : savedIncident ? (
                <>
                  {/* 조회 화면: 타임라인을 사건 내부에 배치 */}
                  <div className="reportToolbar">
  <button
    type="button"
    className="reportSaveButton"
    disabled={busy || detailLoading || reportExporting}
    onClick={saveIncidentReport}
  >
    {reportExporting
      ? '정리본 준비 중…'
      : '사건 정리본 저장'}
  </button>

  <span>
    인쇄 창에서 ‘PDF로 저장’을 선택하세요.
  </span>
</div>

<div ref={reportContentRef}>
  <IncidentDetail
    incident={savedIncident}
    eventCount={events.length}
    disabled={busy}
    onEdit={startEditing}
    onDelete={deleteIncident}
    onCopy={copyClue}
  >
    <TimelineSection
      incidentId={savedIncident.id}
      events={events}
      busy={busy}
    />
  </IncidentDetail>

  <IncidentImages
    key={`${user.id}:${savedIncident.id}`}
    incidentId={savedIncident.id}
    initialImages={savedIncident.images || []}
    disabled={busy}
  />
</div>

{/* 기존 PublicationSettings는 이 아래에 유지 */}

                  <PublicationSettings
                    key={`${user?.id}:${savedIncident.id}`}
                    incidentId={savedIncident.id}
                    disabled={busy}
                  />
                </>
              ) : (
                <div className="empty">
                  왼쪽 목록에서 사건을 선택하거나 새로 작성해주세요.
                </div>
              )}
            </section>
          </div>
        </main>
      )}

      {/* 회원가입·로그인·마이페이지 */}
      {!authLoading &&
        ((page === 'incidents' && !user) ||
          ['login', 'signup', 'account'].includes(page)) && (
          <Account
            key={page}
            mode={page === 'signup' ? 'signup' : 'login'}
            user={user}
            onNavigate={navigate}
            onLogin={signedIn}
            onLogout={logout}
            onNotice={setNotice}
          />
        )}

      {authLoading &&
        ['login', 'signup', 'account'].includes(page) && (
          <main>
            <div className="empty">
              로그인 상태를 확인하고 있어요.
            </div>
          </main>
        )}

      {/* 대화 교육 */}
      {page === 'education' && <EducationPage />}

      {page === 'search' && <PublicCaseSearch />}
      {page === 'admin' && (
        authLoading ? <main><p role="status">로그인 확인 중…</p></main> : user ?
          <AdminPublications key={user.id} /> :
          <Account mode="login" user={user} onNavigate={navigate} onLogin={signedIn} onLogout={logout} onNotice={setNotice} />
      )}
      {page === 'analysis' && <Analysis />}

      <footer>
        <span>낌새 · 기록에서 연결까지</span>
        <span>사건 기록 · 공개 사례 · 예방 교육</span>
      </footer>
    </>
  );
}