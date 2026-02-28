"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Users, Star } from "lucide-react";
import { FITNESS_TRAINING_SERVICES, SERVICE_TYPES, calculatePricePerSession, type ServicePackage } from "@/config/pricing";

interface ServiceSelectionProps {
  onServiceSelect: (service: ServicePackage) => void;
  selectedService?: ServicePackage | null;
}

export default function ServiceSelection({ onServiceSelect, selectedService }: ServiceSelectionProps) {
  const [selectedType, setSelectedType] = useState<keyof typeof SERVICE_TYPES>('personal');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personal': return '👤';
      case 'buddy': return '👥';
      case 'group': return '👨‍👩‍👧‍👦';
      case 'online': return '💻';
      default: return '🏋️';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes}min`;
  };

  const filteredServices = FITNESS_TRAINING_SERVICES.filter(service => service.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Service Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SERVICE_TYPES).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedType === key ? "default" : "outline"}
            onClick={() => setSelectedType(key as keyof typeof SERVICE_TYPES)}
            className="flex items-center gap-2"
          >
            <span>{getTypeIcon(key)}</span>
            {label}
          </Button>
        ))}
      </div>

      {/* Service Description */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg text-gray-900 mb-2">
          {getTypeIcon(selectedType)} {SERVICE_TYPES[selectedType]}
        </h3>
        <p className="text-gray-600">
          {selectedType === 'personal' && 'One-on-one personalized training sessions with dedicated attention and customized workout plans.'}
          {selectedType === 'buddy' && 'Train with a friend or partner for shared motivation and cost-effective fitness training.'}
          {selectedType === 'group' && 'Small group training focused on strength building in a supportive community environment.'}
          {selectedType === 'online' && 'Virtual personal training with unlimited access to professional training and support.'}
        </p>
      </div>

      {/* Service Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card 
            key={service.id} 
            className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedService?.id === service.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:ring-1 hover:ring-gray-300'
            } ${service.isPopular ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50' : ''}`}
            onClick={() => onServiceSelect(service)}
          >
            {service.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-orange-500 text-white px-3 py-1 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Popular
                </Badge>
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold text-gray-900">
                  {service.name}
                </CardTitle>
                {selectedService?.id === service.id && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">{service.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Price */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(service.price)}
                </div>
                {typeof service.sessions === 'number' && (
                  <div className="text-sm text-gray-500">
                    {formatPrice(calculatePricePerSession(service))} per session
                  </div>
                )}
              </div>

              {/* Session Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Sessions
                  </span>
                  <span className="font-medium">
                    {typeof service.sessions === 'number' ? service.sessions : 'Unlimited'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Duration
                  </span>
                  <span className="font-medium">{formatDuration(service.duration)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Validity</span>
                  <span className="font-medium">
                    {service.validity === 1 ? '1 month' : `${service.validity} months`}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-900">Includes:</div>
                {service.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
                {service.features.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{service.features.length - 3} more features
                  </div>
                )}
              </div>

              {/* Select Button */}
              <Button 
                className={`w-full ${
                  selectedService?.id === service.id 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onServiceSelect(service);
                }}
              >
                {selectedService?.id === service.id ? 'Selected' : 'Select Package'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Service Summary */}
      {selectedService && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Selected Service</h4>
                <p className="text-sm text-gray-600">{selectedService.name} - {SERVICE_TYPES[selectedService.type]}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">{formatPrice(selectedService.price)}</div>
                <div className="text-sm text-gray-600">
                  {typeof selectedService.sessions === 'number' 
                    ? `${selectedService.sessions} sessions` 
                    : 'Unlimited sessions'
                  } • {selectedService.validity} month{selectedService.validity > 1 ? 's' : ''} validity
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
