/* eslint-disable */
import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type UniqueIdentifier,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  rectSwappingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { Item, Sortable } from "./components/Item";
import Button from "./components/Button";
import {
  ArrowRightIcon,
  Dice5Icon,
  Layers3Icon,
  PlusIcon,
  SendHorizontalIcon,
  ShuffleIcon,
} from "lucide-react";

function DropArea({ id, items, ...props }) {
  const { setNodeRef, active } = useDroppable({ id });

  const containerRef = useRef<HTMLDivElement>();

  const flexRowWrapStrategy = useCallback(() => {
    console.log(containerRef.current);
  }, []);

  return (
    <div
      ref={(ref) => {
        setNodeRef(ref);
        containerRef.current = ref;
      }}
      {...props}
    >
      {/* <SortableContext items={items} strategy={flexRowWrapStrategy}> */}
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        {items.map((id) => (
          <Sortable key={id} id={id}>
            <Item className={active && id === active.id ? "opacity-50" : ""}>
              {id}
            </Item>
          </Sortable>
        ))}
      </SortableContext>
    </div>
  );
}

function Board(props) {
  return (
    <DropArea
      id="board"
      {...props}
      className="flex gap-2 flex-wrap items-start border bg-stone-100 rounded-lg min-h-20 p-4"
    />
  );
}

function Hand(props) {
  return (
    <DropArea
      id="hand"
      {...props}
      className="flex gap-2 flex-wrap items-start border-2 rounded-lg min-h-50 p-4"
    />
  );
}

// TODO need custom collision detection

export default function App() {
  const [activeId, setActiveId] = useState(null);

  // const [handItems, setHandItems] = useState();
  // const [boardItems, setBoardItems] = useState(["test", "me", "son"]);

  const [items, setItems] = useState({
    board: ["test", "pls", "ignore"],
    hand: ["日本", "語", "が", "わかり", "ま", "す"],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dragStartRef = useRef(null);

  // todo, only use this outside of setState, but does it matter? maybe desync
  const getContainer = (id) => (items.board.includes(id) ? "board" : "hand");

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={({ active }) => {
        dragStartRef.current = performance.now();
        setActiveId(active.id);
      }}
      onDragOver={({ active, over }) => {
        // over always exists b/c using closestCorners collision
        if (over == null) return;

        // @ts-expect-error id is string
        const activeContainer = items.board.includes(active.id)
          ? "board"
          : "hand";

        const isContainer = over.id === "board" || over.id === "hand";
        const overContainer = isContainer
          ? over.id
          : // @ts-expect-error id is string
          items.board.includes(over.id)
          ? "board"
          : "hand";

        if (activeContainer === overContainer) return;

        if (isContainer) {
          // @ts-expect-error fuck you
          setItems((items) => ({
            [activeContainer]: items[activeContainer].filter(
              (id) => id != active.id
            ),
            // TODO, test this is always an empty list b/c closestCorners
            [overContainer]: [...items[overContainer], active.id],
          }));
        } else {
          // @ts-expect-error fuck you
          setItems((items) => {
            const overIndex = items[overContainer].indexOf(over.id);
            return {
              [activeContainer]: items[activeContainer].filter(
                (id) => id !== active.id
              ),
              [overContainer]: [
                ...items[overContainer].slice(0, overIndex),
                active.id,
                ...items[overContainer].slice(overIndex),
              ],
            };
          });
        }
      }}
      onDragEnd={({ active, over, delta }) => {
        setActiveId(null);
        const elapsed = performance.now() - dragStartRef.current;
        if (delta.x === 0 && delta.y === 0 && elapsed < 200) {
          // @ts-expect-error shut up
          setItems((items) => {
            // @ts-expect-error
            const activeContainer = items.board.includes(active.id)
              ? "board"
              : "hand";
            const otherContainer =
              activeContainer === "board" ? "hand" : "board";

            return {
              [activeContainer]: items[activeContainer].filter(
                (id) => id !== active.id
              ),
              [otherContainer]: [...items[otherContainer], active.id],
            };
          });
          return;
        }

        if (over == null) {
          // todo, maybe when switching containers, overId is temporarily undefined
          console.log("over is null", over);
          return;
        }

        if (active.id === over.id) return;

        if (over.id === "board" || over.id === "hand")
          // todo
          throw "not create new list";

        const activeContainer = getContainer(active.id);
        const overContainer = getContainer(over.id);
        const otherContainer = activeContainer === "board" ? "hand" : "board";

        if (activeContainer !== overContainer) throw "not same container";

        // @ts-expect-error shut up
        setItems((items) => {
          // @ts-expect-error id is string
          const activeIndex = items[activeContainer].indexOf(active.id);
          // @ts-expect-error id is string
          const overIndex = items[activeContainer].indexOf(over.id);
          return {
            [otherContainer]: items[otherContainer],
            [activeContainer]: arrayMove(
              items[activeContainer],
              activeIndex,
              overIndex
            ),
          };
        });
      }}
    >
      <div className="h-100svh overflow-hidden flex flex-col gap-8 p-8">
        <Board items={items.board} />
        <div className="flex justify-between">
          <Button className="">
            49
            <Layers3Icon className="h-5 w-5" />
          </Button>
          <div>
            <Button className="">
              <ShuffleIcon className="h-5 w-5" />
            </Button>
            <Button className="">
              <Dice5Icon className="h-5 w-5" />
            </Button>
            <Button className="">
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
          <Button className="bg-green-500 text-white border-transparent ">
            Send
            <ArrowRightIcon className="h-5 w-5" />
          </Button>
        </div>
        <Hand items={items.hand} />
      </div>
      <DragOverlay adjustScale={false}>
        {activeId && <Item className="">{activeId}</Item>}
      </DragOverlay>
    </DndContext>
  );
}

{
  /* <div ref={topRef} className="h-full">
        <motion.div
          drag
          dragConstraints={boundsRef}
          dragSnapToOrigin
          dragElastic={0.25}
          className="w-20 h-20 bg-blue"
        ></motion.div>
      </div>
      <div className="h-full grid grid-cols-4">
        {blocks.map((block, i) => {
          return (
            <motion.div
              drag
              dragConstraints={boundsRef}
              // dragElastic={}
              dragSnapToOrigin={i != index}
              onDragEnd={(_, info) => {
                if (
                  info.point.y <
                    // @ts-expect-error shut up
                    topRef.current.getBoundingClientRect().bottom ||
                  info.velocity.y < -800
                ) {
                  setIndex(i);
                }
              }}
              className="w-20 h-20 bg-red"
            ></motion.div>
          );
        })}
      </div>
  */
}
