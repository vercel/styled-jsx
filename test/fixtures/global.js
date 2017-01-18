const Test = () => (
  <div>
    <style jsx global>{`
      body {
        color: red
      }
    `}</style>
  </div>
)

const Test2 = () => <style global jsx>{'p { color: red }'}</style>
