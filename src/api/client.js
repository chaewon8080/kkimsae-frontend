// src/api/client.js

// 기존 환경변수가 아래 둘 중 어느 형식이든 사용 가능:
// http://localhost:8080
// http://localhost:8080/api
//
// kkimsaeApi.js에서 /api/... 경로를 사용하므로
// 여기서는 주소 끝의 /api를 제거한다.
const API_BASE_URL = (
  import.meta.env.PROD
  ? window.location.origin
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')
)
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const TOKEN_KEY = 'kkimsae-tokens-v1';

// 기존 import가 남아 있어도 실제 서버 모드로 동작
export const USE_MOCKS = false;

let authVersion = 0;
let refreshTask = null;

/* ─────────────────────────────
   에러
───────────────────────────── */

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/* ─────────────────────────────
   로그인 토큰 관리
───────────────────────────── */

export function getAuthVersion() {
  return authVersion;
}

export function getTokens() {
  try {
    const saved = sessionStorage.getItem(TOKEN_KEY);

    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function writeTokens(tokens) {
  if (
    typeof tokens?.accessToken !== 'string' ||
    !tokens.accessToken ||
    typeof tokens?.refreshToken !== 'string' ||
    !tokens.refreshToken
  ) {
    throw new Error('토큰 응답 형식을 확인해주세요.');
  }

  sessionStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  );
}

// 로그인 성공 후 호출
export function establishSession(tokens) {
  writeTokens(tokens);

  // 이전 로그인에서 진행 중이던 요청과 구분
  authVersion += 1;

  // 예전 프론트 코드에서 사용하던 토큰 정리
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function clearSession(notify = false) {
  sessionStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  authVersion += 1;

  if (notify) {
    window.dispatchEvent(
      new CustomEvent('kkimsae:auth-expired')
    );
  }
}

/* ─────────────────────────────
   응답 처리
───────────────────────────── */

async function readResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

function getErrorMessage(status, data) {
  if (Array.isArray(data?.errors)) {
    const messages = data.errors
      .map((error) => {
        if (typeof error === 'string') {
          return error;
        }

        return error.defaultMessage || error.message;
      })
      .filter(Boolean);

    if (messages.length) {
      return messages.join('\n');
    }
  }

  if (
    data?.errors &&
    typeof data.errors === 'object' &&
    !Array.isArray(data.errors)
  ) {
    const messages = Object.values(data.errors).filter(
      (value) => typeof value === 'string'
    );

    if (messages.length) {
      return messages.join('\n');
    }
  }

  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (typeof data?.message === 'string') {
    return data.message;
  }

  switch (status) {
    case 400:
      return '입력값을 확인해주세요.';

    case 401:
      return '로그인이 필요하거나 인증 정보가 올바르지 않습니다.';

    case 403:
      return '접근 권한이 없습니다.';

    case 404:
      return '요청한 정보를 찾을 수 없습니다.';

    case 409:
      return '이미 등록된 정보와 중복됩니다.';

    case 503:
      return '서버가 요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.';

    default:
      return `요청에 실패했습니다. (${status})`;
  }
}

/* ─────────────────────────────
   실제 HTTP 요청
───────────────────────────── */

async function send(
  path,
  options = {},
  accessToken = null
) {
  const headers = new Headers(options.headers || {});

  if (
    options.body != null &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set(
      'Authorization',
      `Bearer ${accessToken}`
    );
  } else {
    headers.delete('Authorization');
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError(
      '백엔드에 연결하지 못했습니다. 서버 실행 상태와 CORS 설정을 확인해주세요.',
      0
    );
  }

  const data = await readResponse(response);

  return {
    response,
    data,
  };
}

/* ─────────────────────────────
   자동 토큰 재발급
───────────────────────────── */

async function refreshAccessToken(version) {
  // 여러 API가 동시에 401을 받아도 재발급은 한 번만 수행
  if (refreshTask?.version === version) {
    return refreshTask.promise;
  }

  const task = {
    version,
    promise: null,
  };

  task.promise = (async () => {
    const tokens = getTokens();

    if (!tokens?.refreshToken) {
      if (version === authVersion) {
        clearSession(true);
      }

      throw new ApiError(
        '다시 로그인해주세요.',
        401
      );
    }

    // 재발급 요청에는 Access Token을 보내지 않음
    const { response, data } = await send(
      '/api/members/reissue',
      {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: tokens.refreshToken,
        }),
      }
    );

    // 요청 도중 로그아웃하거나 계정이 변경된 경우
    if (version !== authVersion) {
      throw new ApiError(
        '로그인 상태가 변경되었습니다. 다시 시도해주세요.',
        401
      );
    }

    if (!response.ok) {
      if ([400, 401, 403].includes(response.status)) {
        clearSession(true);
      }

      // 네트워크·서버 장애라면 토큰을 즉시 지우지 않음
      throw new ApiError(
        getErrorMessage(response.status, data),
        response.status,
        data
      );
    }

    try {
      // Access Token과 Refresh Token 모두 새 값으로 교체
      writeTokens(data);
    } catch {
      clearSession(true);

      throw new ApiError(
        '토큰 재발급 응답이 올바르지 않습니다. 다시 로그인해주세요.',
        401
      );
    }

    return data.accessToken;
  })();

  refreshTask = task;

  try {
    return await task.promise;
  } finally {
    if (refreshTask === task) {
      refreshTask = null;
    }
  }
}

/* ─────────────────────────────
   외부에서 사용하는 공통 요청 함수
───────────────────────────── */

export async function request(
  path,
  options = {},
  { auth = true } = {}
) {
  const version = authVersion;

  const sentAccessToken = auth
    ? getTokens()?.accessToken
    : null;

  let result = await send(
    path,
    options,
    sentAccessToken
  );

  if (auth && result.response.status === 401) {
    if (version !== authVersion) {
      throw new ApiError(
        '로그인 상태가 변경되었습니다.',
        401
      );
    }

    const currentAccessToken =
      getTokens()?.accessToken;

    let nextAccessToken;

    // 다른 요청이 이미 재발급한 토큰이 있다면 재사용
    if (
      currentAccessToken &&
      currentAccessToken !== sentAccessToken
    ) {
      nextAccessToken = currentAccessToken;
    } else {
      nextAccessToken =
        await refreshAccessToken(version);
    }

    if (version !== authVersion) {
      throw new ApiError(
        '로그인 상태가 변경되었습니다.',
        401
      );
    }

    // 실패했던 요청은 새 토큰으로 한 번만 재시도
    result = await send(
      path,
      options,
      nextAccessToken
    );

    if (
      result.response.status === 401 &&
      version === authVersion
    ) {
      clearSession(true);
    }
  }

  if (!result.response.ok) {
    throw new ApiError(
      getErrorMessage(
        result.response.status,
        result.data
      ),
      result.response.status,
      result.data
    );
  }

  return result.data;
}