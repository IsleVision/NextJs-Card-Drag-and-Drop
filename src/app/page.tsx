'use client';
import cn from 'classnames';
import styles from './page.module.scss';
import React, { JSX, useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export default function Home() {

  const [tasks, setTasks] = useState<string[][]>([['Task A', 'Task B', 'Task C'], ['Task D', 'Task E']]); // 2D array of tasks
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [taskNameDragged, setTaskNameDragged] = useState<string>('');
  const [draggedTaskIndex, setDraggedTaskIndex] = useState<{ rowIndex: number; columnIndex: number } | null>(null);
  const containerRefs = useRef<(HTMLElement | null)[]>([]);
  const taskRefs = useRef<(HTMLElement | null)[][]>([]);
  const [floatDiv, setFloatDiv] = useState<JSX.Element | null>(null);

  useEffect(() => {
    const handleFloatDiv = (event: MouseEvent) => {
      const draggedTaskRect = draggedTaskIndex && taskRefs?.current[draggedTaskIndex.columnIndex]?.[draggedTaskIndex.rowIndex]?.getBoundingClientRect();
      setFloatDiv(<div className={styles.floatDiv} style={{
        top: `calc(${event.pageY - 20}px)`,
        left: `calc(${event.pageX - 20}px)`,
        width: draggedTaskRect?.width,
        height: draggedTaskRect?.height,
      }}>{taskNameDragged}</div>);
    };
    const handleMove = (event: MouseEvent) => {
      let reachRowIndex: number = -1, reachColumnIndex: number = -1;
      containerRefs.current.forEach((containerRef, columnIndex) => {
        if (containerRef) {
          const rect = containerRef.getBoundingClientRect();
          if (rect.left <= event.pageX && event.pageX <= rect.right) {
            reachColumnIndex = columnIndex;
          }
        }
      });
      if (reachColumnIndex !== -1 && taskRefs?.current[reachColumnIndex]) {
        taskRefs.current[reachColumnIndex].forEach((taskRef, rowIndex) => {
          if (taskRef) {
            const rect = taskRef.getBoundingClientRect();
            if (rowIndex === 0 && event.pageY <= (rect.top + rect.bottom) / 2) {
              reachRowIndex = 0;
            } else if (rowIndex === taskRefs.current[reachColumnIndex].length - 1 && event.pageY >= (rect.top + rect.bottom) / 2) {
              reachRowIndex = taskRefs.current[reachColumnIndex].length;
            } else {
              const upperRect = taskRefs.current[reachColumnIndex][rowIndex - 1]?.getBoundingClientRect();

              if (upperRect && (upperRect.top + upperRect.bottom) / 2 <= event.pageY && event.pageY <= (rect.top + rect.bottom) / 2) {
                reachRowIndex = rowIndex;
              }
            }
          }
        });
      }

      if (draggedTaskIndex && !(reachRowIndex === -1 && reachColumnIndex === -1) && (![draggedTaskIndex.rowIndex, draggedTaskIndex.rowIndex + 1].includes(reachRowIndex) || reachColumnIndex !== draggedTaskIndex.columnIndex)) {
        setTasks((prevTasks) => {
          const newTasks = prevTasks.map(row => [...row]);
          const draggedTask = newTasks[draggedTaskIndex.columnIndex]?.splice(draggedTaskIndex.rowIndex, 1)[0];
          if (draggedTask) {
            if (draggedTaskIndex.columnIndex !== reachColumnIndex) {
              newTasks[reachColumnIndex]?.splice(reachRowIndex - 1 < 0 ? 0 : reachRowIndex - 1, 0, draggedTask);
            } else if (reachRowIndex === -1) {  //indicate placing to an empty column
              newTasks[reachColumnIndex]?.splice(0, 0, draggedTask);
            } else if (draggedTaskIndex.rowIndex > reachRowIndex) {
              newTasks[reachColumnIndex]?.splice(reachRowIndex, 0, draggedTask);
            } else { //-1 to compensate the upper one removed
              newTasks[reachColumnIndex]?.splice(reachRowIndex - 1, 0, draggedTask);
            }
          }
          taskRefs.current = [[]];
          return newTasks;
        });

        //flushSync to make sure draggedTaskIndex is updated before the next round
        flushSync(() => {
          setDraggedTaskIndex((prev) => {
            if (draggedTaskIndex.columnIndex !== reachColumnIndex) {
              return { rowIndex: reachRowIndex - 1 < 0 ? 0 : reachRowIndex - 1, columnIndex: reachColumnIndex };
            } else if (reachRowIndex === -1) {
              return { rowIndex: 0, columnIndex: reachColumnIndex };
            } else if (prev?.rowIndex && prev.rowIndex > reachRowIndex) {
              return { rowIndex: reachRowIndex, columnIndex: reachColumnIndex };
            } else {
              return { rowIndex: reachRowIndex - 1, columnIndex: reachColumnIndex };
            }
          });
        });
      }
    };

    if (isHolding) {
      document.addEventListener('mousemove', handleFloatDiv);
      document.addEventListener('mousemove', handleMove);
    } else {
      setFloatDiv(null);
      document.removeEventListener('mousemove', handleFloatDiv);
      document.removeEventListener('mousemove', handleMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleFloatDiv);
      document.removeEventListener('mousemove', handleMove);
    };
  }, [isHolding, taskNameDragged, draggedTaskIndex]);

  const startHold = useCallback(
    (taskName: string, rowIndex: number, columnIndex: number) => {
      if (!isHolding) {
        setIsHolding(true);
        setTaskNameDragged(taskName);
        setDraggedTaskIndex({ rowIndex: rowIndex, columnIndex });
      }
    }
    , [isHolding]);

  const endHold = useCallback(() => {
    setIsHolding(false);
  }, []);

  const TaskItem = React.useMemo(() => {
    const Component = React.forwardRef<HTMLDivElement, {
      taskName: string;
      className?: string;
      columnIndex: number;
      rowIndex: number
    }>(
      ({ taskName, className, rowIndex, columnIndex }, ref) => {
        return (
          <div
            className={className}
            onMouseDown={() => startHold(taskName, rowIndex, columnIndex)}
            ref={ref}
            onTouchStart={() => startHold(taskName, rowIndex, columnIndex)}
            onTouchEnd={endHold}
          >
            {taskName}
          </div>
        );
      },
    );
    Component.displayName = 'TaskItem'; // Add displayName
    return Component;
  }, [startHold, endHold]);

  return (
    <div className={cn(styles.page, { [styles.cursorMove]: isHolding })}
         onMouseUp={endHold}

    >
      {floatDiv}

      {tasks.map((tasksGroup, index) => (<React.Fragment key={index}>
        <div className={styles.container}
             ref={(el) => {
               if (el) containerRefs.current[index] = el;
             }}>
          {tasksGroup.map((taskName, taskIndex) => {
              if (!taskRefs.current[index]) {
                taskRefs.current[index] = [];
              }
              return (<TaskItem key={taskIndex}
                                className={cn({
                                  [styles.taskCard__dragged]: isHolding && draggedTaskIndex?.columnIndex === index && draggedTaskIndex?.rowIndex === taskIndex,
                                })}
                                ref={(el) => {
                                  if (el) taskRefs.current[index][taskIndex] = el;
                                }}
                                taskName={taskName}
                                rowIndex={taskIndex}
                                columnIndex={index}
                />
              );
            },
          )}
        </div>
        {index != tasks.length - 1 && <div className={styles.columnBorder} />}
      </React.Fragment>))
      }

    </div>
  );
}
