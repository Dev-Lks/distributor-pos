"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface DateTimePickerProps {
  value: string | null
  onChange: (value: string | null) => void
  label?: string
  placeholder?: string
}

export function DateTimePicker({
  value,
  onChange,
  label = "Data e Hora",
  placeholder = "Selecione data e hora"
}: DateTimePickerProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [isScheduled, setIsScheduled] = useState(false)

  useEffect(() => {
    if (value) {
      const dateObj = new Date(value)
      const dateStr = dateObj.toISOString().split("T")[0]
      const timeStr = dateObj.toTimeString().slice(0, 5)
      setDate(dateStr)
      setTime(timeStr)
      setIsScheduled(true)
    } else {
      setDate("")
      setTime("")
      setIsScheduled(false)
    }
  }, [value])

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    if (newDate && time) {
      onChange(`${newDate}T${time}`)
    } else if (!newDate) {
      onChange(null)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    if (date && newTime) {
      onChange(`${date}T${newTime}`)
    }
  }

  const handleClear = () => {
    setDate("")
    setTime("")
    setIsScheduled(false)
    onChange(null)
  }

  const handleSetNow = () => {
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]
    const timeStr = now.toTimeString().slice(0, 5)
    setDate(dateStr)
    setTime(timeStr)
    setIsScheduled(true)
    onChange(`${dateStr}T${timeStr}`)
  }

  const handleSetTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    const dateStr = tomorrow.toISOString().split("T")[0]
    const timeStr = "09:00"
    setDate(dateStr)
    setTime(timeStr)
    setIsScheduled(true)
    onChange(`${dateStr}T${timeStr}`)
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {!isScheduled ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsScheduled(true)}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Entrega
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="date" className="text-xs text-muted-foreground">
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="time" className="text-xs text-muted-foreground">
                Hora
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetNow}
              className="text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              Agora
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetTomorrow}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Amanhã 9h
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-destructive hover:text-destructive"
            >
              Limpar
            </Button>
          </div>

          {date && time && (
            <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded-md">
              📅 {new Date(`${date}T${time}`).toLocaleString("pt-BR", {
                dateStyle: "full",
                timeStyle: "short"
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
