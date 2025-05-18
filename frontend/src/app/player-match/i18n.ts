export type Locale = 'ko' | 'en' | 'jp';

export const translations = {
  ko: {
    noRecord: '기록이 없습니다.',
    error: '데이터를 불러올 수 없습니다.',
    loading: '로딩 중...',
    searchPlaceholder: '닉네임 검색...'
    , summary: '요약', solo: '솔로', trio: '트리오', recentMatches: '최근 경기', noData: '데이터 없음'
  },
  en: {
    noRecord: 'No records found.',
    error: 'Failed to load data.',
    loading: 'Loading...',
    searchPlaceholder: 'Search nickname...'
    , summary: 'Summary', solo: 'Solo', trio: 'Trio', recentMatches: 'Recent Matches', noData: 'No data'
  },
  jp: {
    noRecord: '記録がありません。',
    error: 'データを読み込めません。',
    loading: '読み込み中...',
    searchPlaceholder: 'ニックネーム検索...'
    , summary: '要約', solo: 'ソロ', trio: 'トリオ', recentMatches: '最近の試合', noData: 'データなし'
  }
};

export function t(locale: Locale, key: keyof typeof translations['ko']): string {
  return translations[locale]?.[key] || translations['ko'][key] || key;
}
