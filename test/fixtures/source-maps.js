export default () => (
  <div>
    <p>test</p>
    <p><em>woot</em></p>
    <style jsx>{'p { color: red }'}</style>
    <style jsx global>{'em { color: green }'}</style>
  </div>
)
