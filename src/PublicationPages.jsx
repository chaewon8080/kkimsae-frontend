import { useEffect, useRef, useState } from 'react';
import { publicationApi as api } from './api/publicationApi';
import { getAuthVersion } from './api/client';

const statuses = {
  PENDING_SUMMARY: 'AI 요약 대기',
  GENERATING_SUMMARY: 'AI 요약 생성 중',
  SUMMARY_FAILED: 'AI 요약 실패',
  PENDING_REVIEW: '검토 대기',
  APPROVED: '공개 승인',
  REJECTED: '반려',
  WITHDRAWN: '철회',
};

const statusName = (status) => statuses[status] || status || '신청 전';

const date = (value) =>
  value ? value.replace('T', ' ').slice(0, 16) : '—';

function ErrorMessage({ message }) {
  return message ? (
    <p className="error" role="alert">
      {message}
    </p>
  ) : null;
}

function Pager({ data, busy, onChange }) {
  if (!data) return null;

  return (
    <div className="publicationPager" aria-label="페이지 이동">
      <button
        disabled={busy || data.number === 0 || data.page === 0}
        onClick={() => onChange((data.number ?? data.page) - 1)}
      >
        이전
      </button>

      <span>
        {(data.number ?? data.page ?? 0) + 1} /{' '}
        {Math.max(data.totalPages || 0, 1)}
      </span>

      <button
        disabled={busy || !(data.hasNext ?? !data.last)}
        onClick={() => onChange((data.number ?? data.page) + 1)}
      >
        다음
      </button>
    </div>
  );
}

export function PublicationSettings({ incidentId, disabled }) {
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [consent, setConsent] = useState(false);

  const alive = useRef(false);
  const contextVersion = useRef(0);
  const actionInProgress = useRef(false);

  useEffect(() => {
    alive.current = true;

    const context = ++contextVersion.current;
    const version = getAuthVersion();

    actionInProgress.current = false;
    setPublication(null);
    setLoading(true);
    setBusy(false);
    setError('');
    setNotice('');
    setConsent(false);

    const isCurrent = () =>
      alive.current &&
      context === contextVersion.current &&
      version === getAuthVersion();

    api.mine(incidentId)
      .then((value) => {
        if (isCurrent()) setPublication(value);
      })
      .catch((err) => {
        if (isCurrent() && err.status !== 404) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });

    return () => {
      alive.current = false;
      contextVersion.current += 1;
    };
  }, [incidentId]);

  async function act(action) {
    if (actionInProgress.current || loading || disabled) return;

    if (
      action === 'withdraw' &&
      !window.confirm(
        '공개 신청을 철회할까요? 공개 중인 사례도 검색에서 제외됩니다.'
      )
    ) {
      return;
    }

    const version = getAuthVersion();
    const context = contextVersion.current;

    const isCurrent = () =>
      alive.current &&
      context === contextVersion.current &&
      version === getAuthVersion();

    actionInProgress.current = true;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (action === 'withdraw') {
        await api.withdraw(incidentId);
        if (!isCurrent()) return;

        setPublication((previous) => ({
          ...previous,
          status: 'WITHDRAWN',
        }));
        setConsent(false);
        setNotice('공개 신청을 철회했습니다.');
        return;
      }

      if (action === 'submit') {
        const submitted = await api.submit(incidentId);
        if (!isCurrent()) return;

        setPublication(submitted);
      }

      setNotice(
        'AI가 공개용 요약을 생성하고 있습니다. 잠시 기다려주세요.'
      );

      const result = await api.summary(incidentId);
      if (!isCurrent()) return;

      setPublication(result);
      setNotice(
        '공개용 요약이 생성되었습니다. 관리자 검토 후 공개됩니다.'
      );
    } catch (err) {
      if (!isCurrent()) return;

      setNotice('');
      setError(err.message || '처리 중 오류가 발생했습니다.');

      // 공개 신청은 성공하고 요약만 실패했을 수 있어 상태를 다시 확인합니다.
      try {
        const current = await api.mine(incidentId);
        if (isCurrent()) setPublication(current);
      } catch {
        // 기존 오류 메시지를 유지합니다.
      }
    } finally {
      if (context === contextVersion.current) {
        actionInProgress.current = false;
        if (alive.current) setBusy(false);
      }
    }
  }

  async function refreshStatus() {
    if (actionInProgress.current || disabled) return;

    const version = getAuthVersion();
    const context = contextVersion.current;

    const isCurrent = () =>
      alive.current &&
      context === contextVersion.current &&
      version === getAuthVersion();

    actionInProgress.current = true;
    setBusy(true);

    try {
      const value = await api.mine(incidentId);

      if (isCurrent()) {
        setPublication(value);
        setError('');
        setNotice('');
      }
    } catch (err) {
      if (isCurrent()) {
        if (err.status === 404) {
          setPublication(null);
          setError('');
          setNotice('');
        } else {
          setError(err.message);
        }
      }
    } finally {
      if (context === contextVersion.current) {
        actionInProgress.current = false;
        if (alive.current) setBusy(false);
      }
    }
  }

  const canSubmit =
    !publication ||
    ['REJECTED', 'WITHDRAWN'].includes(publication.status);

  const canGenerateSummary =
    publication &&
    ['PENDING_SUMMARY', 'SUMMARY_FAILED'].includes(publication.status);

  return (
    <section className="section publicationSettings">
      <div className="heading">
        <h3>공개 사례 설정</h3>
        <span className="badge">
          {loading ? '확인 중' : statusName(publication?.status)}
        </span>
      </div>

      <p>
        내 사건 기록은 비공개로 관리됩니다. 공개를 신청하면 AI가 공개용
        요약을 생성하고, 관리자가 검토한 뒤 사례 검색에 게시합니다.
      </p>

      <p className="hint">
        현재는 공개용 내용 미리보기를 제공하지 않습니다. 공개에 동의하는
        경우에만 신청해주세요.
      </p>

      {publication && (
        <p className="hint">
          신청 {date(publication.requestedAt)} · 검토{' '}
          {date(publication.reviewedAt)}
        </p>
      )}

      <ErrorMessage message={error} />

      {(error || publication?.status === 'GENERATING_SUMMARY') && (
        <button
          disabled={busy || disabled}
          onClick={refreshStatus}
        >
          상태 다시 확인
        </button>
      )}

      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}

      {!loading && (
        <fieldset
          className="plainFieldset"
          disabled={busy || disabled || Boolean(error)}
        >
          {canSubmit ? (
            <>
              <label className="check">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                관리자 검토 후 공개용 사례가 게시되는 것에 동의합니다.
              </label>

              <button
                className="primary"
                disabled={!consent}
                onClick={() => act('submit')}
              >
                {busy ? '신청 및 AI 요약 생성 중…' : '공개 신청'}
              </button>
            </>
          ) : (
            <div className="actions">
              {canGenerateSummary && (
                <button onClick={() => act('summary')}>
                  {busy
                    ? 'AI 요약 생성 중…'
                    : publication.status === 'SUMMARY_FAILED'
                      ? '공개용 요약 다시 생성'
                      : '공개용 요약 생성'}
                </button>
              )}

              {publication.status === 'GENERATING_SUMMARY' && (
                <p role="status" className="hint">
                  AI 요약을 생성하고 있습니다. 잠시 후 상태를 다시 확인해주세요.
                </p>
              )}

              <button
                className="danger"
                onClick={() => act('withdraw')}
              >
                공개 신청 철회
              </button>
            </div>
          )}
        </fieldset>
      )}
    </section>
  );
}

function PublicCase({ item }) {
  return (
    <article className="caseReadable publicCaseDetail">
      <h2>{item.title}</h2>

      <p className="hint">공개일 {date(item.publishedAt)}</p>

      <dl className="publicationFacts">
        <div>
          <dt>접근 경로</dt>
          <dd>{item.channel || '정보 없음'}</dd>
        </div>
        <div>
          <dt>요구 명목</dt>
          <dd>{item.demand || '정보 없음'}</dd>
        </div>
      </dl>

      <h3>사례 요약</h3>
      <p className="publicationText">
        {item.summary || '등록된 요약이 없습니다.'}
      </p>
    </article>
  );
}

export function PublicCaseSearch() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const requestId = useRef(0);

  // 페이지에 처음 들어오면 전체 공개 사례를 조회합니다.
  useEffect(() => {
    const id = ++requestId.current;

    setBusy(true);
    setError('');

    api.search('', 0)
      .then((result) => {
        if (!Array.isArray(result?.content)) {
          throw new Error('목록 응답 형식을 확인해주세요.');
        }

        if (id === requestId.current) {
          setData(result);
        }
      })
      .catch((err) => {
        if (id === requestId.current) {
          setError(err.message || '목록을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (id === requestId.current) {
          setBusy(false);
        }
      });

    return () => {
      requestId.current += 1;
    };
  }, []);

  async function search(nextPage = 0, term = query) {
    const normalizedQuery = term.trim();
    const id = ++requestId.current;

    setBusy(true);
    setError('');
    setSelected(null);
    setData(null);
    setQuery(normalizedQuery);

    try {
      // 빈 검색어는 전체 목록 조회입니다.
      const result = await api.search(normalizedQuery, nextPage);

      if (!Array.isArray(result?.content)) {
        throw new Error('목록 응답 형식을 확인해주세요.');
      }

      if (id === requestId.current) {
        setData(result);
      }
    } catch (err) {
      if (id === requestId.current) {
        setError(err.message || '목록을 불러오지 못했습니다.');
      }
    } finally {
      if (id === requestId.current) {
        setBusy(false);
      }
    }
  }

  async function open(id) {
    const current = ++requestId.current;

    setBusy(true);
    setError('');
    setSelected(null);

    try {
      const item = await api.detail(id);

      if (current === requestId.current) {
        setSelected(item);
      }
    } catch (err) {
      if (current === requestId.current) {
        setError(
          err.status === 404
            ? '철회되었거나 공개되지 않은 사례입니다. 다시 검색해주세요.'
            : err.message || '사례를 불러오지 못했습니다.'
        );
      }
    } finally {
      if (current === requestId.current) {
        setBusy(false);
      }
    }
  }

  function showAll() {
    setInput('');
    search(0, '');
  }

  return (
    <main>
      <form
        className="publicSearchForm"
        onSubmit={(e) => {
          e.preventDefault();
          search(0, input);
        }}
      >
        <label htmlFor="public-query">
          어떤 사례를 찾고 있나요?
          <input
            id="public-query"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 리뷰 출금"
          />
        </label>

        <button
          type="submit"
          className="primary"
          disabled={busy}
        >
          사례 검색
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={showAll}
        >
          전체 보기
        </button>
      </form>

      <p className="hint">
        관리자가 승인한 공개 사례를 최근 승인 순으로 보여줍니다.
        검색어를 입력하고 검색하면 해당하는 사례만 표시됩니다.
        여러 단어를 입력하면 모든 단어가 포함된 사례를 찾습니다.
      </p>

      <ErrorMessage message={error} />

      {busy && <p role="status">불러오는 중…</p>}

      {selected ? (
        <>
          <button onClick={() => setSelected(null)}>
            ← 목록으로 돌아가기
          </button>

          <PublicCase item={selected} />
        </>
      ) : (
        data && (
          <>
            <div className="heading">
              <h2>{query ? '검색 결과' : '전체 공개 사례'}</h2>
              <span>총 {data.totalElements}건</span>
            </div>

            {data.content.length ? (
              <div className="publicationResults">
                {data.content.map((item) => (
                  <button
                    type="button"
                    className="publicationResult"
                    disabled={busy}
                    key={item.id}
                    onClick={() => open(item.id)}
                  >
                    <span className="hint">
                      {item.channel || '접근 경로 정보 없음'} ·{' '}
                      {date(item.publishedAt)}
                    </span>

                    <strong>{item.title}</strong>

                    <span className="publicationExcerpt">
                      {item.summary}
                    </span>

                    <span>자세히 보기 →</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty">
                {query
                  ? '검색 결과가 없습니다. 다른 단어로 검색해보세요.'
                  : '아직 공개된 사례가 없습니다.'}
              </div>
            )}

            <Pager
              data={data}
              busy={busy}
              onChange={(nextPage) => search(nextPage, query)}
            />
          </>
        )
      )}
    </main>
  );
}

const publicFields = [
  ['publicTitle', '공개 제목'],
  ['publicChannel', '접근 경로'],
  ['publicDemand', '요구 명목'],
  ['publicSummary', '공개 요약'],
];

export function AdminPublications() {
  const [filter, setFilter] = useState('PENDING_REVIEW');
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const detailRequest = useRef(0);
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;

    return () => {
      alive.current = false;
      detailRequest.current += 1;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const version = getAuthVersion();

    setListLoading(true);
    setData(null);
    setError('');

    api.list(filter, page)
      .then((result) => {
        if (!Array.isArray(result?.content)) {
          throw new Error('관리자 목록 응답 형식을 확인해주세요.');
        }

        if (!cancelled && version === getAuthVersion()) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!cancelled && version === getAuthVersion()) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, page, reload]);

  async function open(id) {
    const current = ++detailRequest.current;
    const version = getAuthVersion();

    setBusy(true);
    setError('');
    setNotice('');
    setDetail(null);
    setReason('');

    try {
      const value = await api.adminDetail(id);

      if (
        !alive.current ||
        current !== detailRequest.current ||
        version !== getAuthVersion()
      ) {
        return;
      }

      setDetail(value);
      setForm(
        Object.fromEntries(
          publicFields.map(([key]) => [key, value[key] || ''])
        )
      );
    } catch (err) {
      if (
        alive.current &&
        current === detailRequest.current &&
        version === getAuthVersion()
      ) {
        setError(err.message);
      }
    } finally {
      if (alive.current && current === detailRequest.current) {
        setBusy(false);
      }
    }
  }

  async function review(action) {
    if (busy || !detail || detail.status !== 'PENDING_REVIEW') return;

    if (action === 'reject' && !reason.trim()) {
      setError('반려 사유를 입력해주세요.');
      return;
    }

    if (
      action === 'approve' &&
      publicFields.some(([key]) => !form[key]?.trim())
    ) {
      setError(
        '공개 제목, 접근 경로, 요구 명목, 공개 요약을 모두 입력해주세요.'
      );
      return;
    }

    if (
      !window.confirm(
        action === 'approve'
          ? '작성한 공개용 내용으로 승인할까요?'
          : '이 신청을 반려할까요?'
      )
    ) {
      return;
    }

    const version = getAuthVersion();

    setBusy(true);
    setError('');
    setNotice('');

    try {
      let result;

      if (action === 'approve') {
        const payload = {
          title: form.publicTitle.trim(),
          channel: form.publicChannel.trim(),
          demand: form.publicDemand.trim(),
          summary: form.publicSummary.trim(),
        };

        result = await api.approve(detail.id, payload);
      } else {
        result = await api.reject(detail.id, reason.trim());
      }

      if (!alive.current || version !== getAuthVersion()) return;

      setDetail(result);
      setNotice(
        action === 'approve'
          ? '승인했습니다. 사례 검색에서 확인할 수 있습니다.'
          : '반려했습니다.'
      );
      setReload((value) => value + 1);
    } catch (err) {
      if (alive.current && version === getAuthVersion()) {
        setError(err.message);
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  return (
    <main>
      <div className="heading">
        <h2>공개 신청 검토</h2>
        <button
          disabled={busy || listLoading}
          onClick={() => setReload((value) => value + 1)}
        >
          목록 새로고침
        </button>
      </div>

      <label className="publicationFilter">
        상태
        <select
          disabled={busy}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
            setDetail(null);
            setNotice('');
          }}
        >
          {Object.entries(statuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <ErrorMessage message={error} />

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      <div className="publicationAdminGrid">
        <section aria-label="공개 신청 목록">
          {listLoading ? (
            <p role="status">목록을 불러오는 중…</p>
          ) : data?.content.length ? (
            data.content.map((item) => (
              <button
                key={item.id}
                disabled={busy}
                className={`publicationResult ${
                  detail?.id === item.id ? 'selected' : ''
                }`}
                onClick={() => open(item.id)}
              >
                <strong>
                  {item.publicTitle || `공개 신청 #${item.id}`}
                </strong>
                <span>
                  {statusName(item.status)} · 사건 #{item.incidentId}
                </span>
                <span className="hint">
                  {date(item.requestedAt)}
                </span>
              </button>
            ))
          ) : (
            data && (
              <p className="empty">해당 상태의 신청이 없습니다.</p>
            )
          )}

          <Pager
            data={data}
            busy={busy || listLoading}
            onChange={(value) => {
              setPage(value);
              setDetail(null);
            }}
          />
        </section>

        <section>
          {detail ? (
            <>
              <div className="heading">
                <h2>신청 #{detail.id}</h2>
                <span className="badge">
                  {statusName(detail.status)}
                </span>
              </div>

              <section className="publicationSource">
                <h3>신청 시점 원문</h3>

                {[
                  ['sourceTitle', '제목'],
                  ['sourceDescription', '사건 설명'],
                  ['sourceChannel', '접근 경로'],
                  ['sourceDemand', '요구 명목'],
                  ['sourceTimeline', '타임라인'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <h4>{label}</h4>
                    <p className="publicationText">
                      {detail[key] || '정보 없음'}
                    </p>
                  </div>
                ))}
              </section>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  review('approve');
                }}
              >
                <fieldset
                  className="plainFieldset"
                  disabled={
                    busy || detail.status !== 'PENDING_REVIEW'
                  }
                >
                  <h3>공개용 내용</h3>
                  <p className="hint">
                    개인정보와 식별 가능한 내용이 포함되지 않았는지
                    확인해주세요.
                  </p>

                  {publicFields.map(([key, label]) => (
                    <label key={key}>
                      {label}
                      {key === 'publicSummary' ? (
                        <textarea
                          rows={8}
                          required
                          value={form[key] || ''}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [key]: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <input
                          required
                          value={form[key] || ''}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [key]: e.target.value,
                            })
                          }
                        />
                      )}
                    </label>
                  ))}

                  <button className="primary" type="submit">
                    공개 승인
                  </button>

                  <label>
                    반려 사유
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => review('reject')}
                  >
                    반려
                  </button>
                </fieldset>
              </form>

              {detail.reviewNote && (
                <p className="notice">
                  검토 메모: {detail.reviewNote}
                </p>
              )}

              <p className="hint">
                신청 {date(detail.requestedAt)} · 검토{' '}
                {date(detail.reviewedAt)}
              </p>
            </>
          ) : (
            <div className="empty">
              {busy
                ? '불러오는 중…'
                : '신청을 선택하면 원문과 공개용 내용을 검토할 수 있습니다.'}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}