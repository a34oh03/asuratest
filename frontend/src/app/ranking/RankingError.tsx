// app/ranking/RankingError.tsx
export default function RankingError() {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <img src="/static/error_image.png" alt="에러 이미지" width={160} className="mb-4" />
        <p className="text-lg font-semibold mb-2">다들 게임을 안해서 못봐요</p>
        <div className="mt-32 mb-4">
          <p className="text-base">이 창에 대한 내용은 아래 디시글 참고</p>
          <a
            href="https://gall.dcinside.com/asurajang/20184"
            target="_blank"
            className="text-blue-600 underline text-base"
          >
            https://gall.dcinside.com/asurajang/20184
          </a>
        </div>
      </div>
    );
  }
  