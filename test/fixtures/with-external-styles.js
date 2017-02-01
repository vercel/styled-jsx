export default () => (
  <div>
    <p>test</p>
    <style jsx>{`p {color: red }`}</style>
    <style jsx src="./external-styles.js" />
  </div>
)
