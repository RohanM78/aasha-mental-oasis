import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CheckSquare, Square, Calendar as CalendarIcon, Clock } from "lucide-react";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { useSupabase } from "@/hooks/useSupabase";
import { supabase } from "@/integrations/supabase/client";

interface CalendarTabProps {
  isPatient?: boolean;
  patientSession?: any;
}

export const CalendarTab = ({ isPatient = false, patientSession }: CalendarTabProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { createTask, updateTask, getTasks } = useSupabase();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Always use authenticated user id
  const getUserId = () => supabase.auth.getUser().then(({ data }) => data.user?.id);

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const userId = await getUserId();
        if (userId) {
          const data = await getTasks(userId);
          setTasks(data);
        }
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [isPatient, patientSession]);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      try {
        const updatedTask = await updateTask(id, { is_completed: !task.is_completed });
        if (updatedTask) {
          setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
        }
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
  };

  const handleAddTask = async (newTask: { title: string; date: string; time: string; repeat: string }) => {
    try {
      const userId = await getUserId();
      if (userId) {
        const datetime = new Date(`${newTask.date}T${newTask.time}`);
        const task = await createTask({
          title: newTask.title,
          datetime: datetime.toISOString(),
          is_completed: false
        }, userId);
        if (task) {
          setTasks(prev => [...prev, task]);
        }
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getTasksForDate = (date: Date | undefined) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.datetime) return false;
      const taskDate = new Date(task.datetime).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const selectedDateTasks = getTasksForDate(selectedDate);
  const completedCount = selectedDateTasks.filter(task => task.is_completed).length;

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Calendar & Tasks</h1>
        <p className="text-muted-foreground">Plan and track your daily activities</p>
      </div>

      {/* Calendar */}
      <Card className="bg-gradient-to-br from-card to-purple-primary/10 border-purple-primary/20">
        <div className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md mx-auto"
          />
        </div>
      </Card>

      {/* Selected Date Tasks */}
      <Card className="bg-gradient-to-br from-card to-purple-secondary/10 border-purple-secondary/20">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {selectedDate?.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'short', 
                day: 'numeric' 
              })}
            </h3>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {selectedDateTasks.length} completed
            </span>
          </div>

          {selectedDateTasks.length > 0 ? (
            <div className="space-y-2">
              {selectedDateTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTask(task.id)}
                    className="p-0 h-auto"
                  >
                    {task.is_completed ? (
                      <CheckSquare className="h-5 w-5 text-success" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <span className={`block ${
                      task.is_completed 
                        ? "text-muted-foreground line-through" 
                        : "text-foreground"
                    }`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{task.datetime ? new Date(task.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">No tasks scheduled for this date</p>
            </div>
          )}
        </div>
      </Card>

      {/* Progress Overview */}
      {selectedDateTasks.length > 0 && (
        <Card className="bg-gradient-to-br from-card to-purple-accent/10 border-purple-accent/20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">Daily Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((completedCount / selectedDateTasks.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / selectedDateTasks.length) * 100}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <AddTaskDialog onAddTask={handleAddTask} />
    </div>
  );
};