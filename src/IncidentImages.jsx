import { useEffect, useRef, useState } from 'react';
import { getAuthVersion, request } from './api/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function IncidentImages({
  incidentId,
  initialImages = [],
  disabled = false,
}) {
  const inputRef = useRef(null);
  const mountedRef = useRef(true);
  const workingRef = useRef(false);

  const [file, setFile] = useState(null);
  const [images, setImages] = useState(initialImages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function selectFile(event) {
    const selected = event.target.files?.[0] || null;

    setFile(null);
    setError('');
    setMessage('');

    if (!selected) return;

    let validationError = '';

    if (!/\.(jpe?g|png)$/i.test(selected.name)) {
      validationError = 'JPG, JPEG, PNG 사진만 선택해주세요.';
    } else if (selected.size === 0) {
      validationError = '빈 파일은 업로드할 수 없습니다.';
    } else if (selected.size > MAX_FILE_SIZE) {
      validationError = '사진은 10MB 이하만 업로드할 수 있습니다.';
    }

    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }

    setFile(selected);
  }

  async function run(uploadFile = false) {
    if (disabled || workingRef.current || (uploadFile && !file)) return;

    workingRef.current = true;
    setBusy(true);
    setError('');
    setMessage('');

    const version = getAuthVersion();
    const canUpdate = () =>
      mountedRef.current && version === getAuthVersion();

    let uploadCompleted = false;

    try {
      if (uploadFile) {
        const body = new FormData();
        body.append('file', file);

        await request(
          `/api/incidents/${encodeURIComponent(incidentId)}/images`,
          { method: 'POST', body }
        );

        uploadCompleted = true;

        if (!canUpdate()) return;

        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
      }

      const incident = await request(
        `/api/incidents/${encodeURIComponent(incidentId)}`
      );

      if (!canUpdate()) return;

      setImages(incident.images || []);
      setMessage(
        uploadCompleted
          ? '사진을 업로드했습니다.'
          : '사진 목록을 새로 불러왔습니다.'
      );
    } catch (err) {
      if (canUpdate()) {
        setError(
          uploadCompleted
            ? '업로드는 완료됐지만 목록을 불러오지 못했습니다. 사진 새로고침을 눌러주세요.'
            : err.message || '요청에 실패했습니다.'
        );
      }
    } finally {
      workingRef.current = false;

      if (canUpdate()) setBusy(false);
    }
  }

  async function deleteImage(image) {
  if (disabled || workingRef.current) return;

  if (!window.confirm(`"${image.originalName}" 사진을 삭제할까요?`)) {
    return;
  }

  workingRef.current = true;
  setBusy(true);
  setError('');
  setMessage('');

  const version = getAuthVersion();
  const canUpdate = () =>
    mountedRef.current && version === getAuthVersion();

  try {
    await request(
      `/api/incidents/${encodeURIComponent(incidentId)}/images/${encodeURIComponent(image.id)}`,
      { method: 'DELETE' }
    );

    if (!canUpdate()) return;

    setImages((current) =>
      current.filter((item) => item.id !== image.id)
    );
    setMessage('사진을 삭제했습니다.');
  } catch (err) {
    if (canUpdate()) {
      setError(err.message || '사진 삭제에 실패했습니다.');
    }
  } finally {
    workingRef.current = false;

    if (canUpdate()) {
      setBusy(false);
    }
  }
}

  return (
    <section className="section">
      <h3>증거 사진</h3>

      <p className="hint">
        JPG·PNG, 파일당 최대 10MB. 사진은 공개 사례에 포함되지 않습니다.
      </p>

      <label>
        사진 선택
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          disabled={disabled || busy}
          onChange={selectFile}
        />
      </label>

      {file && (
        <p className="hint">
          {file.name} · {(file.size / 1024 / 1024).toFixed(2)}MB
        </p>
      )}

      <div className="actions">
        <button
          type="button"
          className="primary"
          disabled={disabled || busy || !file}
          onClick={() => run(true)}
        >
          {busy ? '처리 중…' : '사진 업로드'}
        </button>

        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => run(false)}
        >
          사진 새로고침
        </button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <p className="hint">
        사진이 열리지 않으면 사진 새로고침을 눌러주세요.
      </p>

      {images.length === 0 ? (
        <p className="hint">등록된 사진이 없습니다.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {images.map((image) => (
            <figure key={`${image.id}:${image.url || ''}`} style={{ margin: 0 }}>
              {image.url ? (
                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={image.url}
                    alt={image.originalName}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'contain',
                      background: '#f1f5f9',
                    }}
                  />
                </a>
              ) : (
                <p className="hint">
                  기존 로컬 저장 사진입니다. 다시 업로드해주세요.
                </p>
              )}

              <figcaption style={{ overflowWrap: 'anywhere' }}>
                <strong>{image.originalName}</strong>
                <p className="hint">
                  {(image.size / 1024 / 1024).toFixed(2)}MB
                  {' · '}
                  {image.uploadedAt?.replace('T', ' ').slice(0, 16)}
                </p>
              </figcaption>
              <button
  type="button"
  className="danger"
  disabled={disabled || busy}
  onClick={() => deleteImage(image)}
>
  사진 삭제
</button>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}