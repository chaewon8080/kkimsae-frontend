export const mockPosts = [
  { id: 1, category: '피해 경험', title: '부업 수익 출금 전 인증비를 요구받았어요', body: '미션을 마쳤는데 출금을 하려면 인증비를 입금해야 한다고 했어요.', nickname: '파란고래', avatar: '파', likes: 42, comments: [{ id: 11, nickname: '안전지킴이', avatar: '안', body: '추가 입금은 멈추고 대화와 계좌 정보를 보관하세요.', likes: 8 }] },
  { id: 2, category: '의심 사례', title: '택배 주소 확인 링크가 담긴 문자를 받았어요', body: '택배 회사라고 하면서 링크를 눌러 주소를 수정해 달라고 했어요.', nickname: '구름산책', avatar: '구', likes: 35, comments: [{ id: 21, nickname: '모래별', avatar: '모', body: '택배사 공식 앱에서 직접 배송 내역을 확인해 보세요.', likes: 5 }] },
  { id: 3, category: '질문·상담', title: '상대가 보낸 링크를 눌렀는데 어떻게 해야 할까요?', body: '링크만 열고 정보는 입력하지 않았어요. 어떤 점을 확인해야 할까요?', nickname: '새벽빛', avatar: '새', likes: 29, comments: [] },
  { id: 4, category: '의심 사례', title: '은행 직원을 사칭하며 인증번호를 요구해요', body: '대출 신청 확인을 이유로 문자 인증번호를 알려 달라고 했습니다.', nickname: '느린파도', avatar: '느', likes: 21, comments: [] },
  { id: 5, category: '피해 경험', title: '중고거래 후 판매자가 연락을 끊었어요', body: '송금 후 물품을 보내지 않고 연락이 끊겼습니다.', nickname: '초록우산', avatar: '초', likes: 18, comments: [] },
];

export const mockAnalysis = {
  score: 82,
  level: '매우 높음',
  type: '투자·부업 사기',
  methods: ['출금 전 추가 입금', '인증비 요구', '고수익 부업 제안'],
  evidence: '“수익을 출금하려면 인증비를 먼저 입금하세요.”',
  guide: ['추가 입금과 출금 수수료 결제를 중단하세요.', '대화방, 상대 연락처, 계좌번호와 송금 내역을 보관하세요.', '이미 송금했다면 즉시 이용 은행과 112에 연락하세요.'],
  similarCases: [
    { id: 101, title: '부업 수익 출금 전 수수료를 요구받았어요', reasons: ['부업 제안', '추가 입금 요구'] },
    { id: 102, title: '미션을 완료했는데 인증비를 더 내라고 했어요', reasons: ['인증비 요구', '출금 제한'] },
  ],
};
