/*
 * 로그스토리 디자인 메모: ‘폐허의 황혼’.
 * 기존 단일 HTML 게임은 iframe으로 보존하고, 바깥 래퍼에 생존자 단말기 크롬만 더한다.
 */

export default function Home() {
  return (
    <main className="logstory-shell" aria-label="로그스토리 게임">
      <div className="terminal-signal terminal-signal-top" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}assets/logstory-mark.png`} alt="" />
        <span>LOGSTORY // SURVIVAL RECORD</span>
      </div>
      <div className="logstory-frame">
        <div className="terminal-seam terminal-seam-left" aria-hidden="true" />
        <div className="terminal-seam terminal-seam-right" aria-hidden="true" />
        <iframe
          title="로그스토리"
          src={`${import.meta.env.BASE_URL}logstory.html`}
          className="logstory-game"
          allow="fullscreen"
        />
      </div>
      <div className="terminal-signal terminal-signal-bottom" aria-hidden="true">
        <span>FIELD UNIT 01</span>
        <span className="signal-dot" />
        <span>LINK STABLE</span>
      </div>
    </main>
  );
}
