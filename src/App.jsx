import WowBook from './components/WowBook'

function App() {
  return (
    <div className="w-full h-screen bg-book-bg flex items-center justify-center overflow-hidden relative">
      <WowBook />
      
      {/* Optional: Background music - uncomment to enable */}
      {/* <audio autoPlay loop>
        <source src="/music.mp3" type="audio/mpeg" />
      </audio> */}
    </div>
  )
}

export default App
