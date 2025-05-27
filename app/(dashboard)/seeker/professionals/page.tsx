"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { Search, Star, Clock, Filter } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"

interface Professional {
  id: string
  name: string
  title: string
  bio: string
  category: string
  rate_per_15min: number
  average_rating: number
  total_reviews: number
  is_verified: boolean
  avatar_url?: string
}

export default function ProfessionalsPage() {
  const router = useRouter()
  const { userData } = useUserData()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [priceRange, setPriceRange] = useState([200])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [ratingFilter, setRatingFilter] = useState("all")

  useEffect(() => {
    if (!userData) {
      router.push("/auth/login")
      return
    }
    fetchProfessionals()
  }, [userData, router])

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from("professional_profiles")
        .select(`
          *,
          users!professional_profiles_user_id_fkey(name, avatar_url)
        `)
        .eq("is_verified", true)
        .order("average_rating", { ascending: false })

      if (error) throw error

      const formattedProfessionals =
        data?.map((prof) => ({
          id: prof.id,
          name: prof.users?.name || "Professional",
          title: prof.title,
          bio: prof.bio || "",
          category: prof.category,
          rate_per_15min: Number(prof.rate_per_15min),
          average_rating: Number(prof.average_rating),
          total_reviews: prof.total_reviews,
          is_verified: prof.is_verified,
          avatar_url: prof.users?.avatar_url,
        })) || []

      setProfessionals(formattedProfessionals)
    } catch (error) {
      console.error("Error fetching professionals:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProfessionals = professionals.filter((pro) => {
    const matchesPrice = pro.rate_per_15min <= priceRange[0]
    const matchesSearch =
      searchQuery === "" ||
      pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || pro.category.toLowerCase() === categoryFilter.toLowerCase()
    const matchesRating = ratingFilter === "all" || pro.average_rating >= Number(ratingFilter)

    return matchesPrice && matchesSearch && matchesCategory && matchesRating
  })

  if (!userData) return null

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">Loading professionals...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="font-semibold text-lg md:text-2xl">Find Professionals</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, profession, or category..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Professionals</SheetTitle>
                <SheetDescription>Narrow down your search with these filters.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="coaching">Coaching</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-range">Maximum Rate: ${priceRange[0]}/15min</Label>
                  <Slider
                    id="price-range"
                    defaultValue={[200]}
                    max={200}
                    step={5}
                    value={priceRange}
                    onValueChange={setPriceRange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Rating</Label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select minimum rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Rating</SelectItem>
                      <SelectItem value="4.5">4.5+</SelectItem>
                      <SelectItem value="4.0">4.0+</SelectItem>
                      <SelectItem value="3.5">3.5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button className="flex-1" onClick={() => {}}>
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPriceRange([200])
                    setCategoryFilter("all")
                    setRatingFilter("all")
                  }}
                >
                  Reset
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfessionals.length > 0 ? (
          filteredProfessionals.map((professional) => (
            <Card key={professional.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex p-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg mr-4">
                    {professional.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{professional.name}</h3>
                    <p className="text-sm text-muted-foreground">{professional.title}</p>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-primary text-primary mr-1" />
                      <span className="text-sm">{professional.average_rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground ml-1">({professional.total_reviews})</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>${professional.rate_per_15min}/15min</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {professional.category}
                    </Badge>
                  </div>
                </div>
                <div className="px-6 pb-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {professional.bio || "Professional offering expert consultation services."}
                  </p>
                </div>
                <div className="border-t px-6 py-4">
                  <Link href={`/seeker/professionals/${professional.id}`}>
                    <Button size="sm" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-muted p-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No professionals found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
            <Button
              onClick={() => {
                setSearchQuery("")
                setPriceRange([200])
                setCategoryFilter("all")
                setRatingFilter("all")
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
