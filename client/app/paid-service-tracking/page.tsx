'use client'
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string;
  cost: number;
  billingCycle: 'monthly' | 'yearly' | 'quarterly' | 'one-time';
  nextBillingDate: Date;
  category: string;
  status: 'active' | 'cancelled' | 'trial';
  notes: string;
}

export default function PaidServiceTrackingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'quarterly' | 'one-time'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState<Date>();
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'active' | 'cancelled' | 'trial'>('active');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextBillingDate) return;

    const newService: Service = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      cost: parseFloat(cost),
      billingCycle,
      nextBillingDate,
      category,
      status,
      notes
    };

    setServices([...services, newService]);
    setName('');
    setDescription('');
    setCost('');
    setBillingCycle('monthly');
    setNextBillingDate(undefined);
    setCategory('');
    setStatus('active');
    setNotes('');
  };

  const updateStatus = (id: string, newStatus: 'active' | 'cancelled' | 'trial') => {
    setServices(services.map(service => 
      service.id === id ? { ...service, status: newStatus } : service
    ));
  };

  const deleteService = (id: string) => {
    setServices(services.filter(service => service.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      default: return '';
    }
  };

  const getBillingCycleColor = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return 'text-blue-500';
      case 'yearly': return 'text-purple-500';
      case 'quarterly': return 'text-orange-500';
      case 'one-time': return 'text-gray-500';
      default: return '';
    }
  };

  const calculateTotalCost = () => {
    return services.reduce((total, service) => {
      if (service.status === 'active') {
        switch (service.billingCycle) {
          case 'monthly': return total + service.cost;
          case 'yearly': return total + (service.cost / 12);
          case 'quarterly': return total + (service.cost / 3);
          case 'one-time': return total + (service.cost / 12); // Spread one-time costs over a year
          default: return total;
        }
      }
      return total;
    }, 0);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Paid Service Tracking</h1>
      <p className="text-muted-foreground mb-8">
        Keep track of your paid subscriptions and services. Monitor costs, billing cycles, and manage your subscriptions effectively.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Service</CardTitle>
            <CardDescription>
              Add a new paid service or subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Service Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter service name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter service description"
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Cost</label>
                <Input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="Enter cost"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Billing Cycle</label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'yearly' | 'quarterly' | 'one-time')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Next Billing Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !nextBillingDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextBillingDate ? format(nextBillingDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={nextBillingDate}
                      onSelect={setNextBillingDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Software, Entertainment, Productivity"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'cancelled' | 'trial')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes"
                  className="min-h-[100px]"
                />
              </div>

              <Button type="submit" className="w-full">
                Add Service
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
              <CardDescription>
                Total monthly cost: ${calculateTotalCost().toFixed(2)}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Services</CardTitle>
              <CardDescription>
                View and manage your subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={cn("px-2 py-1 rounded-full text-xs", getStatusColor(service.status))}>
                          {service.status}
                        </span>
                        <span className={cn("px-2 py-1 rounded-full text-xs", getBillingCycleColor(service.billingCycle))}>
                          {service.billingCycle}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>${service.cost} / {service.billingCycle}</span>
                      <span>Next billing: {format(service.nextBillingDate, "PPP")}</span>
                    </div>
                    {service.notes && (
                      <p className="text-sm text-muted-foreground">{service.notes}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <select
                        value={service.status}
                        onChange={(e) => updateStatus(service.id, e.target.value as 'active' | 'cancelled' | 'trial')}
                        className={cn("text-xs px-2 py-1 rounded-full", getStatusColor(service.status))}
                      >
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteService(service.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No services added yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 