"use client"

import React, { useState, useEffect } from "react";
import { AdminOnlyGuard } from "@/components/auth/AdminOnlyGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, User, Phone, Mail, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface TrainerApplication {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  certifications: string[];
  experience: string;
  specialties: string[];
  hourly_rate: number;
  bio: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  availability: string;
  background_check_consent: boolean;
}

export default function TrainerApplicationsPage() {
  const [applications, setApplications] = useState<TrainerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/trainer-applications', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/trainer-applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      // Refresh applications
      await fetchApplications();
      
    } catch (err: any) {
      console.error('Error updating application:', err);
      setError(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle size={12} className="mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => app.status === activeTab);

  if (loading) {
    return (
      <AdminOnlyGuard>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AdminOnlyGuard>
    );
  }

  return (
    <AdminOnlyGuard>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trainer Applications</h1>
            <p className="text-gray-600 mt-1">Review and manage trainer applications</p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {applications.length} applications
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({applications.filter(app => app.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({applications.filter(app => app.status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({applications.filter(app => app.status === 'rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No {activeTab} applications
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === 'pending' 
                      ? "No pending trainer applications at this time."
                      : `No ${activeTab} applications found.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredApplications.map((application) => (
                <Card key={application.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User size={20} />
                          {application.first_name} {application.last_name}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <span className="flex items-center gap-1">
                            <Mail size={14} />
                            {application.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone size={14} />
                            {application.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Applied {new Date(application.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Personal Details</h4>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">DOB:</span> {application.date_of_birth}</p>
                          <p><span className="font-medium">Gender:</span> {application.gender || 'Not specified'}</p>
                          <p><span className="font-medium">Hourly Rate:</span> ${application.hourly_rate || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
                        <div className="text-sm">
                          {application.certifications?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {application.certifications.map((cert, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">No certifications listed</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {application.experience && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Experience</h4>
                        <p className="text-sm text-gray-700">{application.experience}</p>
                      </div>
                    )}

                    {application.bio && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                        <p className="text-sm text-gray-700">{application.bio}</p>
                      </div>
                    )}

                    {application.availability && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Availability</h4>
                        <p className="text-sm text-gray-700">{application.availability}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Background Check Consent:</span>
                      {application.background_check_consent ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle size={12} className="mr-1" />Consented
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          <XCircle size={12} className="mr-1" />Not Consented
                        </Badge>
                      )}
                    </div>

                    {application.status === 'pending' && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          size="sm"
                          onClick={() => updateApplicationStatus(application.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle size={16} className="mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <XCircle size={16} className="mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminOnlyGuard>
  );
}
