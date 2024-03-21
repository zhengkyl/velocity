/* eslint-disable */
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function Item({ className = "", children, ...props }) {
  return (
    <div
      className={`bg-white border p-3 touch-none select-none leading-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Sortable(props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.children}
    </div>
  );
}
