import { describe, it, expect } from "vitest"

// contoh implementasi FIFO sederhana
function allocateFIFO(batches: { id: string; qty: number }[], requestQty: number) {
  const result: { id: string; used: number }[] = []
  let remaining = requestQty

  for (const batch of batches) {
    if (remaining <= 0) break
    const used = Math.min(batch.qty, remaining)
    result.push({ id: batch.id, used })
    remaining -= used
  }

  if (remaining > 0) throw new Error("Not enough stock")

  return result
}

describe("FIFO Allocation", () => {
  it("allocates stock in FIFO order", () => {
    const batches = [
      { id: "b1", qty: 5 },
      { id: "b2", qty: 10 },
    ]

    const result = allocateFIFO(batches, 8)

    expect(result).toEqual([
      { id: "b1", used: 5 },
      { id: "b2", used: 3 },
    ])
  })

  it("throws error if stock is not enough", () => {
    const batches = [{ id: "b1", qty: 2 }]
    expect(() => allocateFIFO(batches, 5)).toThrow("Not enough stock")
  })
})
