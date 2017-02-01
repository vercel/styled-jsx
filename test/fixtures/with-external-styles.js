export default () => (
  <div>
    <p>test</p>
    <style jsx>{`p {color: red }`}</style>
    <style jsx href="./external-styles.js" />
  </div>
)
