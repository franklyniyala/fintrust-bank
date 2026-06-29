pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = "ekenefranklyn"
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/fintrust-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/fintrust-frontend"

        IMAGE_TAG = "${BUILD_NUMBER}"

        K8s_DIR = "K8s"
        MONITORING_DIR = "monitoring"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                credentialsId: 'GITHUB_LOGIN',
                url: 'https://github.com/franklyniyala/fintrust-bank.git'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Backend Unit Test') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage ('Install Frontend Dependencies') {
            steps {
                dir ('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Frontend Unit Test') {
            steps {
                dir('frontend') {
                    sh 'npm test'
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    sh '''
                    docker run --rm \
                    -e SONAR_TOKEN=$SONAR_TOKEN \
                    -v $(pwd):/usr/src \
                    sonarsource/sonar-scanner-cli \
                    -Dsonar.projectKey=frank-org_fintrust \
                    -Dsonar.organization=frank-org \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=https://sonarcloud.io \
                    '''
                }
            }
        }
        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh '''
                    docker build \
                    -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                    -t ${BACKEND_IMAGE}:latest .
                    '''
                }
            }   
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh '''
                    docker build \
                    -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                    -t ${FRONTEND_IMAGE}:latest .
                    '''
                }
            }
        }

        stage('Push Images to DockerHub')  {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DOCKER_LOGIN', usernameVariable: 'DOCKER_LOGIN', passwordVariable: 'DOCKER_PASSWORD')]) {
                sh '''
                docker login -u $DOCKER_LOGIN -p $DOCKER_PASSWORD
                docker push ${BACKEND_IMAGE}:latest
                docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                docker push ${FRONTEND_IMAGE}:latest
                docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                '''
                }
            }
        }

        stage('Deploy Core Monitoring') {
            steps {
                withCredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG')]) {
                    sh '''
                    export KUBECONFIG=$KUBECONFIG

                    echo "========== Creating Monitoring Namespace =========="
                    kubectl apply -f ${MONITORING_DIR}/monitoring-namespace.yml

                    echo "========== Deploying Node Exporter =========="
                    kubectl apply -f ${MONITORING_DIR}/node-exporter/

                    echo "========== Deploying Prometheus =========="
                    kubectl apply -f ${MONITORING_DIR}/prometheus/configmap.yaml
                    kubectl apply -f ${MONITORING_DIR}/prometheus/deployment.yaml
                    kubectl apply -f ${MONITORING_DIR}/prometheus/service.yml

                    echo "========== Deploying Grafana =========="
                    kubectl apply -f ${MONITORING_DIR}/grafana/
                    '''
                }
            }
        }

        stage('Deploy Monitoring Exporters') {
            steps {
                withCredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG')]) {
                    sh '''
                    export KUBECONFIG=$KUBECONFIG

                    echo "========== Deploying PostgreSQL Exporter =========="
                    kubectl apply -f ${MONITORING_DIR}/postgres-exporter/

                    echo "========== Deploying Kube State Metrics =========="
                    kubectl apply -f ${MONITORING_DIR}/kube-state-metrics/serviceaccount.yml
                    kubectl apply -f ${MONITORING_DIR}/kube-state-metrics/clusterrole.yml
                    kubectl apply -f ${MONITORING_DIR}/kube-state-metrics/clusterrolebinding.yml
                    kubectl apply -f ${MONITORING_DIR}/kube-state-metrics/deployment.yml
                    kubectl apply -f ${MONITORING_DIR}/kube-state-metrics/service.yml
                    '''
                }
            }
        }

        stage('Deploy Alerting Stack') {
            steps {
                withCredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG')]) {
                    sh '''
                    export KUBECONFIG=$KUBECONFIG
    
                    echo "========== Deploying Alertmanager =========="
                    kubectl apply -f ${MONITORING_DIR}/alertmanager/configmap.yml
                    kubectl apply -f ${MONITORING_DIR}/alertmanager/deployment.yml
                    kubectl apply -f ${MONITORING_DIR}/alertmanager/service.yml

                    echo "========== Restarting Prometheus =========="
                    kubectl rollout restart deployment/prometheus -n monitoring
                    kubectl rollout status deployment/prometheus -n monitoring
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                withCredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG')]) {
                    sh '''
                    export KUBECONFIG=$KUBECONFIG
                    kubectl rollout status deployment/postgres-db
                    kubectl rollout status deployment/fintrust-backend
                    kubectl rollout status deployment/fintrust-frontend
                    kubectl rollout status deployment/prometheus -n monitoring
                    kubectl rollout status deployment/grafana -n monitoring
                    kubectl rollout status deployment/postgres-exporter -n monitoring
                    '''
                }
            }
        }
    }

    post {
        success {
            echo ' ✅ Unit Test Completed Successfully.'
            echo ' ✅ SonarQube Scan Completed Successfully.'
            echo ' ✅ Docker Images Built Successfully.'
            echo ' ✅ Monitoring Deployed Successfully.'
            echo ' ✅ Docker Images Pushed to DockerHub Successfully.'
            echo ' ✅ Application Deployed to Kubernetes Successfully.'
        }
        failure {
            echo ' ❌ Pipeline failed. Please check the logs for details.'
        }
    }
}
