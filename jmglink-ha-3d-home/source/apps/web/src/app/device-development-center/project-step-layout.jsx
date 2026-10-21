import { a as React } from "../../vendor/react.js";
export default function ProjectStepLayout({ className = "", children }) {
  const items = React.Children.toArray(children);
  const isFooter = item => React.isValidElement(item) && (item.type === "footer" || item.props.className === "ddc-lifecycle-footer");
  return <div className={`${className} ddc-fixed-step`}>
    <div className="ddc-step-scroll">{items.filter(item => !isFooter(item))}</div>
    {items.filter(isFooter)}
  </div>;
}
