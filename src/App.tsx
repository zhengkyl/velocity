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
        {items.map((item) => (
          <Sortable key={item.id} id={item.id}>
            <Item
              className={active && item.id === active.id ? "opacity-50" : ""}
            >
              {item.text}
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

function getContainer(items, id) {
  return items.board.some((item) => item.id === id) ? "board" : "hand";
}

// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
function toShuffled(original) {
  const array = original.slice();
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

type Word = {
  id: UniqueIdentifier;
  text: string;
};

// TODO need custom collision detection
export default function App() {
  const [activeId, setActiveId] = useState(null);

  // Skip 0 to avoid falsey bugs
  const idCounterRef = useRef(0);
  const getNewId = () => ++idCounterRef.current;
  const word = (text) => ({ id: getNewId(), text });

  // THIS WIDE TYPE IS TO SILENCE TS, ACTUAL TYPE IS {board: string[], hand: string[]}
  const [items, setItems] = useState<{ [key: string]: Word[] }>({
    board: [word("test"), word("pls"), word("ignore")],
    hand: [
      word("日本"),
      word("語"),
      word("が"),
      word("わかり"),
      word("ま"),
      word("す"),
    ],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dragStartRef = useRef(null);

  const getWordForId = (id) =>
    (
      items.board.find((item) => item.id === id) ||
      items.hand.find((item) => item.id === id)
    )?.text;

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

        const activeContainer = getContainer(items, active.id);

        const isContainer = over.id === "board" || over.id === "hand";
        const overContainer = isContainer
          ? over.id
          : getContainer(items, over.id);

        if (activeContainer === overContainer) return;

        setItems((items) => {
          let overValue;
          if (isContainer) {
            const overIndex = items[overContainer].findIndex(
              (item) => item.id === over.id
            );
            overValue = [
              ...items[overContainer].slice(0, overIndex),
              { id: active.id, text: getWordForId(active.id) },
              ...items[overContainer].slice(overIndex),
            ];
          } else {
            // TODO, test this is always an empty list b/c closestCorners
            overValue = [
              ...items[overContainer],
              { id: active.id, text: getWordForId(active.id) },
            ];
          }
          return {
            [activeContainer]: items[activeContainer].filter(
              (item) => item.id !== active.id
            ),
            [overContainer]: overValue,
          };
        });
      }}
      onDragEnd={({ active, over, delta }) => {
        setActiveId(null);
        const elapsed = performance.now() - dragStartRef.current;
        if (delta.x === 0 && delta.y === 0 && elapsed < 200) {
          setItems((items) => {
            const activeContainer = getContainer(items, active.id);
            const otherContainer =
              activeContainer === "board" ? "hand" : "board";

            return {
              [activeContainer]: items[activeContainer].filter(
                (item) => item.id !== active.id
              ),
              [otherContainer]: [
                ...items[otherContainer],
                { id: active.id, text: getWordForId(active.id) },
              ],
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
          throw "onDragEnd run before item moved to other list";

        setItems((items) => {
          const activeContainer = getContainer(items, active.id);
          const overContainer = getContainer(items, over.id);
          const otherContainer = activeContainer === "board" ? "hand" : "board";

          if (activeContainer !== overContainer) throw "not same container";

          const activeIndex = items[activeContainer].findIndex(
            (item) => item.id === active.id
          );
          const overIndex = items[activeContainer].findIndex(
            (item) => item.id === over.id
          );
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
            <Button
              className=""
              onClick={() => {
                setItems((items) => ({
                  board: toShuffled(items.board),
                  hand: items.hand,
                }));
              }}
            >
              <ShuffleIcon className="h-5 w-5" />
            </Button>
            <Button className="">
              <Dice5Icon className="h-5 w-5" />
            </Button>
            <Button
              className=""
              onClick={() => {
                setItems((items) => ({
                  board: items.board,
                  hand: [
                    ...items.hand,
                    word("please"),
                    word("do"),
                    word("not"),
                    word("try"),
                  ],
                }));
              }}
            >
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
          <Button
            className="bg-green-500 text-white border-transparent"
            onClick={() => {}}
          >
            Send
            <ArrowRightIcon className="h-5 w-5" />
          </Button>
        </div>
        <Hand items={items.hand} />
      </div>
      <DragOverlay adjustScale={false}>
        {activeId && <Item className="">{getWordForId(activeId)}</Item>}
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
